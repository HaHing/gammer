export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asErrorRecord(error: unknown): Record<string, unknown> {
  return typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
}

export function getErrorStatus(error: unknown): number | null {
  const rec = asErrorRecord(error);
  const candidates = [
    rec.status,
    rec.statusCode,
    asErrorRecord(rec.response).status,
  ];
  for (const value of candidates) {
    if (typeof value === 'number') return value;
  }
  return null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const rec = asErrorRecord(error);
  if (typeof rec.message === 'string') return rec.message;
  if (typeof rec.error === 'string') return rec.error;
  return String(error);
}

export function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== null) {
    if (status === 408 || status === 409 || status === 425 || status === 429) return true;
    if (status >= 500) return true;
    return false;
  }

  const msg = getErrorMessage(error);
  return /(timeout|timed out|etimedout|econnreset|econnrefused|ehostunreach|socket hang up|temporar|network|rate limit|503|502|504|429)/i.test(msg);
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseDelayMs = Math.max(50, opts.baseDelayMs ?? 600);
  const maxDelayMs = Math.max(baseDelayMs, opts.maxDelayMs ?? 6000);
  const factor = Math.max(1, opts.factor ?? 2);
  const jitter = Math.min(0.8, Math.max(0, opts.jitter ?? 0.2));
  const shouldRetry = opts.shouldRetry ?? ((error: unknown) => isRetryableError(error));

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry = attempt < attempts && shouldRetry(error, attempt);
      if (!canRetry) break;

      const rawDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(factor, attempt - 1));
      const jitterRatio = 1 - jitter + Math.random() * jitter * 2;
      const delayMs = Math.max(0, Math.round(rawDelay * jitterRatio));

      opts.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(getErrorMessage(lastError));
}
