import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { retryAsync, getErrorMessage, isRetryableError } from './retry';

type Role = 'system' | 'user' | 'assistant';
type AITextResponse = {
  content: Array<{ type: string; text: string }>;
  stop_reason: string | null;
};

interface AzureChoiceDelta {
  content?: string;
}

interface AzureStreamChunk {
  choices?: Array<{
    delta?: AzureChoiceDelta;
    finish_reason?: string | null;
  }>;
}

class AzureOpenAIError extends Error {
  status: number | null;
  code: string | null;
  retryAfterMs: number | null;

  constructor(message: string, status: number | null, code: string | null, retryAfterMs: number | null) {
    super(message);
    this.name = 'AzureOpenAIError';
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

const AI_CREATE_RETRY_ATTEMPTS = parseIntEnv('AI_CREATE_RETRY_ATTEMPTS', 4, 1, 8);
const AI_STREAM_RETRY_ATTEMPTS = parseIntEnv('AI_STREAM_RETRY_ATTEMPTS', 3, 1, 6);
const AI_RETRY_BASE_DELAY_MS = parseIntEnv('AI_RETRY_BASE_DELAY_MS', 900, 100, 20000);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function tryParseJSON(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
  } catch {
    // ignore
  }
  return null;
}

function parseRetryAfterMs(headers: Headers): number | null {
  const msRaw = headers.get('retry-after-ms') || headers.get('x-ms-retry-after-ms');
  if (msRaw) {
    const ms = Number(msRaw);
    if (Number.isFinite(ms) && ms > 0) return Math.round(ms);
  }

  const secRaw = headers.get('retry-after');
  if (secRaw) {
    const seconds = Number(secRaw);
    if (Number.isFinite(seconds) && seconds > 0) return Math.round(seconds * 1000);
  }

  return null;
}

function buildAzureErrorFromPayload(payload: Record<string, unknown>, fallbackMessage: string, status: number | null, retryAfterMs: number | null): AzureOpenAIError {
  const errorObj = asRecord(payload.error);
  const message = typeof errorObj.message === 'string'
    ? errorObj.message
    : typeof payload.message === 'string'
      ? payload.message
      : fallbackMessage;
  const code = typeof errorObj.code === 'string'
    ? errorObj.code
    : typeof payload.code === 'string'
      ? payload.code
      : null;
  return new AzureOpenAIError(message, status, code, retryAfterMs);
}

async function assertAzureResponseOk(res: Response, scope: string): Promise<void> {
  if (res.ok) return;
  const text = await res.text().catch(() => '');
  const payload = tryParseJSON(text) || {};
  const retryAfterMs = parseRetryAfterMs(res.headers);
  const err = buildAzureErrorFromPayload(
    payload,
    `[AzureOpenAI] ${scope} failed: ${res.status} ${text.slice(0, 300)}`,
    res.status,
    retryAfterMs
  );
  throw err;
}

function normalizeTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item && typeof (item as { text?: unknown }).text === 'string') {
          return (item as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function toOpenAIMessages(params: {
  system?: unknown;
  messages?: Array<{ role: string; content: unknown }>;
}): Array<{ role: Role; content: string }> {
  const result: Array<{ role: Role; content: string }> = [];

  const systemText = normalizeTextContent(params.system);
  if (systemText) result.push({ role: 'system', content: systemText });

  for (const msg of params.messages || []) {
    const role: Role = msg.role === 'assistant' ? 'assistant' : 'user';
    const content = normalizeTextContent(msg.content);
    if (!content) continue;
    result.push({ role, content });
  }

  if (result.length === 0) {
    result.push({ role: 'user', content: '' });
  }

  return result;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

interface CodexProviderConfig {
  model: string;
  modelProvider: string;
  baseUrl: string;
  envKey: string;
  wireApi: string;
}

let cachedCodexConfig: CodexProviderConfig | null | undefined;

function readCodexConfig(): CodexProviderConfig | null {
  if (cachedCodexConfig !== undefined) return cachedCodexConfig;

  try {
    const explicitPath = process.env.CODEX_CONFIG_PATH || '';
    const userName = process.env.SUDO_USER || process.env.USER || '';
    const candidates = [
      explicitPath,
      path.join(os.homedir(), '.codex', 'config.toml'),
      process.env.HOME ? path.join(process.env.HOME, '.codex', 'config.toml') : '',
      userName ? path.join('/Users', userName, '.codex', 'config.toml') : '',
      '/Users/hahing/.codex/config.toml',
    ].filter(Boolean);

    const configPath = candidates.find((p) => fs.existsSync(p));
    if (!configPath) {
      cachedCodexConfig = null;
      return null;
    }

    const text = fs.readFileSync(configPath, 'utf8');
    const model = text.match(/^\s*model\s*=\s*"([^"]+)"/m)?.[1] || '';
    const modelProvider = text.match(/^\s*model_provider\s*=\s*"([^"]+)"/m)?.[1] || '';
    if (!modelProvider) {
      cachedCodexConfig = null;
      return null;
    }

    const sectionHeader = `[model_providers.${modelProvider}]`;
    const sectionStart = text.indexOf(sectionHeader);
    const sectionBody = sectionStart >= 0 ? text.slice(sectionStart + sectionHeader.length) : '';
    const nextSectionStart = sectionBody.search(/\n\s*\[/);
    const section = nextSectionStart >= 0 ? sectionBody.slice(0, nextSectionStart) : sectionBody;
    const baseUrl = section.match(/^\s*base_url\s*=\s*"([^"]+)"/m)?.[1] || '';
    const envKey = section.match(/^\s*env_key\s*=\s*"([^"]+)"/m)?.[1] || '';
    const wireApi = section.match(/^\s*wire_api\s*=\s*"([^"]+)"/m)?.[1] || '';

    cachedCodexConfig = {
      model,
      modelProvider,
      baseUrl: stripTrailingSlash(baseUrl),
      envKey,
      wireApi: wireApi || 'chat',
    };
    return cachedCodexConfig;
  } catch {
    cachedCodexConfig = null;
    return null;
  }
}

function getAzureConfig() {
  const codexCfg = readCodexConfig();
  const baseUrl = stripTrailingSlash(process.env.AZURE_OPENAI_BASE_URL || (codexCfg?.modelProvider === 'azure' ? codexCfg.baseUrl : ''));
  const endpoint = stripTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT || '');
  const apiKey = process.env.AZURE_OPENAI_API_KEY
    || (codexCfg?.envKey ? process.env[codexCfg.envKey] || '' : '');
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AI_MODEL || codexCfg?.model || 'gpt-4.1';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';
  const wireApi = process.env.AZURE_OPENAI_WIRE_API || codexCfg?.wireApi || 'chat';
  return { baseUrl, endpoint, apiKey, deployment, apiVersion, wireApi };
}

function createAzureUrl(stream: boolean): string {
  const { baseUrl, endpoint, deployment, apiVersion, wireApi } = getAzureConfig();

  if (baseUrl) {
    if (wireApi === 'responses') return `${baseUrl}/responses`;
    return `${baseUrl}/chat/completions`;
  }
  if (!endpoint) throw new Error('AZURE_OPENAI_ENDPOINT/AZURE_OPENAI_BASE_URL is not set');
  return `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}&stream=${stream ? 'true' : 'false'}`;
}

function toResponsesInput(params: {
  system?: unknown;
  messages?: Array<{ role: string; content: unknown }>;
}) {
  return toOpenAIMessages({ system: params.system, messages: params.messages }).map((m) => ({
    role: m.role,
    content: [{ type: 'input_text', text: m.content }],
  }));
}

function extractResponsesText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const rec = data as Record<string, unknown>;

  if (typeof rec.output_text === 'string') return rec.output_text;

  const responseObj = rec.response as Record<string, unknown> | undefined;
  if (responseObj && typeof responseObj.output_text === 'string') return responseObj.output_text;

  const output = (rec.output || responseObj?.output) as unknown;
  if (Array.isArray(output)) {
    const texts: string[] = [];
    for (const item of output) {
      const irec = item as Record<string, unknown>;
      const content = irec.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        const crec = c as Record<string, unknown>;
        const t = crec.text;
        if (typeof t === 'string' && t) texts.push(t);
      }
    }
    return texts.join('');
  }

  return '';
}

function buildAzureBody(params: {
  system?: unknown;
  messages?: Array<{ role: string; content: unknown }>;
  max_tokens?: number;
  maxTokens?: number;
  temperature?: number;
}) {
  const { baseUrl, deployment, wireApi } = getAzureConfig();
  const maxTokens = params.max_tokens ?? params.maxTokens ?? 4096;

  if (baseUrl && wireApi === 'responses') {
    return {
      model: deployment,
      input: toResponsesInput({ system: params.system, messages: params.messages }),
      max_output_tokens: maxTokens,
      temperature: typeof params.temperature === 'number' ? params.temperature : 0.3,
    };
  }

  return {
    messages: toOpenAIMessages({ system: params.system, messages: params.messages }),
    ...(baseUrl ? { model: deployment } : {}),
    max_tokens: maxTokens,
    temperature: typeof params.temperature === 'number' ? params.temperature : 0.3,
  };
}

async function azureCreate(params: {
  system?: unknown;
  messages?: Array<{ role: string; content: unknown }>;
  max_tokens?: number;
  maxTokens?: number;
  temperature?: number;
}): Promise<AITextResponse> {
  const { apiKey, baseUrl, wireApi } = getAzureConfig();
  if (!apiKey) throw new Error('AZURE_OPENAI_API_KEY is not set');

  return retryAsync(
    async () => {
      const res = await fetch(createAzureUrl(false), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(buildAzureBody(params)),
      });

      await assertAzureResponseOk(res, 'create');
      const data = await res.json();
      const text = baseUrl && wireApi === 'responses'
        ? extractResponsesText(data)
        : data.choices?.[0]?.message?.content ?? '';
      const finishReason = baseUrl && wireApi === 'responses'
        ? (data.status === 'completed' ? 'stop' : null)
        : data.choices?.[0]?.finish_reason ?? null;

      return {
        content: [{ type: 'text', text: String(text) }],
        stop_reason: finishReason,
      };
    },
    {
      attempts: AI_CREATE_RETRY_ATTEMPTS,
      baseDelayMs: AI_RETRY_BASE_DELAY_MS,
      shouldRetry: (error) => isRetryableError(error),
      onRetry: (error, attempt, delayMs) => {
        console.warn(`[AzureOpenAI] create retry ${attempt}/${AI_CREATE_RETRY_ATTEMPTS} in ${delayMs}ms: ${getErrorMessage(error).slice(0, 160)}`);
      },
    }
  );
}

class AzureStreamWrapper {
  private readonly listeners: Array<(chunk: string) => void> = [];
  private finalPromise?: Promise<AITextResponse>;

  constructor(
    private readonly params: {
      system?: unknown;
      messages?: Array<{ role: string; content: unknown }>;
      max_tokens?: number;
      maxTokens?: number;
      temperature?: number;
    }
  ) {}

  on(event: string, handler: (chunk: string) => void) {
    if (event === 'text') this.listeners.push(handler);
    this.ensureStarted();
    return this;
  }

  async finalMessage() {
    return this.ensureStarted();
  }

  private emitText(chunk: string) {
    for (const listener of this.listeners) listener(chunk);
  }

  private ensureStarted(): Promise<AITextResponse> {
    if (!this.finalPromise) {
      this.finalPromise = this.run();
    }
    return this.finalPromise;
  }

  private async run(): Promise<AITextResponse> {
    let hasEmittedText = false;
    const streamAttempts = AI_STREAM_RETRY_ATTEMPTS;

    return retryAsync(
      async () => this.runOnce((chunk) => {
        if (!chunk) return;
        hasEmittedText = true;
        this.emitText(chunk);
      }),
      {
        attempts: streamAttempts,
        baseDelayMs: AI_RETRY_BASE_DELAY_MS,
        shouldRetry: (error) => !hasEmittedText && isRetryableError(error),
        onRetry: (error, attempt, delayMs) => {
          console.warn(`[AzureOpenAI] stream retry ${attempt}/${streamAttempts} in ${delayMs}ms: ${getErrorMessage(error).slice(0, 160)}`);
        },
      }
    );
  }

  private async runOnce(emitChunk: (chunk: string) => void): Promise<AITextResponse> {
    const { apiKey, baseUrl, wireApi } = getAzureConfig();
    if (!apiKey) throw new Error('AZURE_OPENAI_API_KEY is not set');

    const res = await fetch(createAzureUrl(true), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        ...buildAzureBody(this.params),
        stream: true,
      }),
    });

    await assertAzureResponseOk(res, 'stream');
    if (!res.body) throw new Error('[AzureOpenAI] stream failed: response body is empty');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let finishReason: string | null = null;
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          currentEvent = '';
          continue;
        }
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
          continue;
        }
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const json = JSON.parse(data) as AzureStreamChunk & Record<string, unknown>;
          const payloadType = typeof json.type === 'string' ? json.type : '';
          const eventType = payloadType || currentEvent;

          if (eventType.includes('response.failed') || eventType.endsWith('.error')) {
            const response = asRecord(json.response);
            const errorPayload = Object.keys(response).length > 0 ? response : json;
            throw buildAzureErrorFromPayload(errorPayload, '[AzureOpenAI] response.failed event received', 429, null);
          }

          if (baseUrl && wireApi === 'responses') {
            const delta = typeof json.delta === 'string'
              ? json.delta
              : typeof json.output_text === 'string'
                ? json.output_text
                : '';

            if (delta) {
              fullText += delta;
              emitChunk(delta);
            }

            if (eventType.includes('response.completed')) {
              finishReason = 'stop';
            }
            continue;
          }

          const choice = json.choices?.[0];
          const delta = choice?.delta?.content || '';
          if (delta) {
            fullText += delta;
            emitChunk(delta);
          }
          if (choice?.finish_reason) finishReason = choice.finish_reason;
        } catch (error) {
          if (error instanceof AzureOpenAIError) throw error;
          // Ignore malformed SSE chunks
        }
      }
    }

    return {
      content: [{ type: 'text', text: fullText }],
      stop_reason: finishReason,
    };
  }
}

const codexConfig = readCodexConfig();
const configuredBackend = (process.env.AI_BACKEND || '').toLowerCase();
const defaultModel = process.env.AI_MODEL || codexConfig?.model || '';

const useAzureOpenAI = configuredBackend === 'claude'
  ? false
  : configuredBackend === 'gpt' || configuredBackend === 'azure-openai'
    ? true
    : true; // default backend: GPT

const anthropicClient = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

export const MODEL = defaultModel || (useAzureOpenAI ? (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1') : 'claude-sonnet-4-6');
export const AI_BACKEND = useAzureOpenAI ? 'gpt' : 'claude';

export function getAIResolvedConfig() {
  const azure = getAzureConfig();
  return {
    backend: AI_BACKEND,
    model: MODEL,
    azureBaseUrl: azure.baseUrl,
    azureEndpoint: azure.endpoint,
    azureDeployment: azure.deployment,
    azureApiVersion: azure.apiVersion,
    azureWireApi: azure.wireApi,
    retry: {
      createAttempts: AI_CREATE_RETRY_ATTEMPTS,
      streamAttempts: AI_STREAM_RETRY_ATTEMPTS,
      baseDelayMs: AI_RETRY_BASE_DELAY_MS,
    },
  };
}

export const anthropic: {
  messages: {
    create: (params: Record<string, unknown>) => Promise<{
      content: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
      stop_reason: string | null;
    }>;
    stream: (params: Record<string, unknown>) => {
      on: (event: string, handler: (chunk: string) => void) => unknown;
      finalMessage: () => Promise<{
        content: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
        stop_reason: string | null;
      }>;
    };
  };
} = useAzureOpenAI
  ? {
    messages: {
      create: (params) => azureCreate(params),
      stream: (params) => new AzureStreamWrapper(params),
    },
  }
  : anthropicClient as unknown as {
    messages: {
      create: (params: Record<string, unknown>) => Promise<{
        content: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
        stop_reason: string | null;
      }>;
      stream: (params: Record<string, unknown>) => {
        on: (event: string, handler: (chunk: string) => void) => unknown;
        finalMessage: () => Promise<{
          content: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
          stop_reason: string | null;
        }>;
      };
    };
  };
