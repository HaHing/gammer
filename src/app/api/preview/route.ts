import { NextRequest, NextResponse } from 'next/server';
import type { PageCount, StyleTheme } from '@/lib/types';
import { conductResearch } from '@/lib/research-engine';
import { generateWithAI } from '@/lib/ai-generator';
import { checkQuality } from '@/lib/quality-checker';
import { optimizeSlides } from '@/lib/self-optimizer';
import { buildDeliveryPackage } from '@/lib/delivery-package';
import { cachePreview } from '../generate/route';
import { auth } from '@/lib/auth';
import { QuotaExceededError, ensureQuotaForPages, getQuotaStatus } from '@/lib/quota';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { topic, description, pageCount, theme, scenes } = await req.json() as {
    topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string;
  };

  try {
    await ensureQuotaForPages(userId, pageCount);

    const research = await conductResearch(topic, description || '', scenes || '', pageCount);
    const findingsCount = research.results[0]?.findings?.length || 0;
    console.log(`[Preview] Research: ${findingsCount} findings, ${research.keyStats.length} stats`);

    let slides = await generateWithAI(topic, description || '', pageCount, theme, scenes || '', research);

    let { issues, score } = checkQuality(slides);
    console.log(`[Preview] First pass: score=${score}, issues=${issues.length}`);

    if (score < 80 || issues.some(i => i.severity === 'error')) {
      slides = await optimizeSlides(slides, issues, score, pageCount, theme);
      const recheck = checkQuality(slides);
      issues = recheck.issues;
      score = recheck.score;
    }

    const topSources = [...new Set(research.results.flatMap((r) => r.findings.map((f) => f.source)))].slice(0, 8);
    const sourcesCount = new Set(research.results.flatMap((r) => r.findings.map((f) => f.source))).size;
    const delivery = buildDeliveryPackage({
      topic,
      theme,
      pageCount,
      slides,
      issues,
      score,
      research,
    });

    const quota = await getQuotaStatus(userId);
    const previewId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cachePreview(previewId, userId, slides);

    return NextResponse.json({
      previewId, slides, issues, score,
      delivery,
      quota,
      research: {
        summary: research.summary,
        keyStats: research.keyStats,
        findingsCount,
        sourcesCount,
        topSources,
      },
    });
  } catch (e: unknown) {
    if (e instanceof QuotaExceededError) {
      return NextResponse.json({ error: e.message, code: 'QUOTA_EXCEEDED', quota: e.detail }, { status: e.status });
    }
    console.error('Preview generation failed:', e);
    return NextResponse.json({ error: (e as Error).message || 'Preview failed' }, { status: 500 });
  }
}
