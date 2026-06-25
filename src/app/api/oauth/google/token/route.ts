import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CURL_TIMEOUT_MS = 20_000;
const STATUS_SEPARATOR = '\n__STATUS__:';

export const runtime = 'nodejs';

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function parseJson(input: string): unknown | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function parseCurlOutput(output: string): { statusCode: number; bodyText: string } {
  const idx = output.lastIndexOf(STATUS_SEPARATOR);
  if (idx < 0) {
    return { statusCode: 200, bodyText: output };
  }

  const bodyText = output.slice(0, idx);
  const statusRaw = output.slice(idx + STATUS_SEPARATOR.length).trim();
  const statusCode = Number.parseInt(statusRaw, 10);

  return {
    statusCode: Number.isNaN(statusCode) ? 200 : statusCode,
    bodyText,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!body.trim()) {
    return noStoreJson(
      {
        error: 'invalid_request',
        error_description: 'Missing request body',
      },
      400
    );
  }

  const incomingType = req.headers.get('content-type') || 'application/x-www-form-urlencoded';
  const incomingAuth = req.headers.get('authorization');

  const args = [
    '-4',
    '-sS',
    '--connect-timeout',
    '8',
    '--max-time',
    '15',
    '-X',
    'POST',
    GOOGLE_TOKEN_URL,
    '-H',
    `Content-Type: ${incomingType}`,
  ];

  if (incomingAuth) {
    args.push('-H', `Authorization: ${incomingAuth}`);
  }

  args.push('--data-raw', body, '-w', `${STATUS_SEPARATOR}%{http_code}`);

  try {
    const { stdout } = await execFileAsync('curl', args, {
      timeout: CURL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });

    const { statusCode, bodyText } = parseCurlOutput(stdout);
    const parsed = parseJson(bodyText);

    if (parsed) {
      return noStoreJson(parsed, statusCode);
    }

    return noStoreJson(
      {
        error: 'server_error',
        error_description: 'Invalid token response payload',
      },
      502
    );
  } catch (error) {
    const err = error as { message?: string; stderr?: string };
    return noStoreJson(
      {
        error: 'server_error',
        error_description: 'Token relay request failed',
        detail: err.stderr || err.message || 'UNKNOWN_ERROR',
      },
      502
    );
  }
}
