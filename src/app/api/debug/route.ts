import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    anthropicBaseUrl: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'NOT SET',
    anthropicKeyPrefix: (process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || 'NOT SET').substring(0, 15),
    googleBaseUrl: process.env.GOOGLE_BASE_URL || 'NOT SET',
    googleModel: process.env.GOOGLE_MODEL || 'NOT SET',
    googleKeyPrefix: (process.env.GOOGLE_API_KEY || 'NOT SET').substring(0, 15),
  });
}
