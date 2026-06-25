import { NextResponse } from 'next/server';
import { AI_BACKEND, MODEL } from '@/lib/model';
import { getAIResolvedConfig } from '@/lib/ai-factory';

export async function GET() {
  const resolved = getAIResolvedConfig();
  return NextResponse.json({
    aiBackend: AI_BACKEND,
    model: MODEL,
    resolved,
    anthropicBaseUrl: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'NOT SET',
    anthropicKeyPrefix: (process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || 'NOT SET').substring(0, 15),
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT || 'NOT SET',
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'NOT SET',
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION || 'NOT SET',
    azureKeyPrefix: (process.env.AZURE_OPENAI_API_KEY || 'NOT SET').substring(0, 15),
  });
}
