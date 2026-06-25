import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);
const CHECK_TARGETS = [
  { name: 'Google Auth', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
  { name: 'Google Token', url: 'https://oauth2.googleapis.com/token' },
  { name: 'Google Userinfo', url: 'https://openidconnect.googleapis.com/v1/userinfo' },
];

function getEnvFlag(value: string | undefined): boolean {
  return (value || '').trim().length > 0;
}

async function probe(url: string): Promise<string | null> {
  try {
    await execFileAsync(
      'curl',
      ['-4', '-sS', '--connect-timeout', '4', '--max-time', '6', '-I', url],
      { timeout: 8_000 }
    );
    return null;
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    return (err.stderr || err.message || 'NETWORK_ERROR').trim();
  }
}

export async function GET() {
  const configured = getEnvFlag(process.env.AUTH_GOOGLE_ID) && getEnvFlag(process.env.AUTH_GOOGLE_SECRET);

  if (!configured) {
    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        reason: 'Google OAuth 未配置（缺少 AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET）',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  for (const target of CHECK_TARGETS) {
    const error = await probe(target.url);
    if (error) {
      return NextResponse.json(
        {
          configured: true,
          reachable: false,
          reason: `${target.name} 不可达：${error}`,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  return NextResponse.json(
    {
      configured: true,
      reachable: true,
      reason: null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
