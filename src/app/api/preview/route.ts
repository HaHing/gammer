import { NextRequest, NextResponse } from 'next/server';
import type { PageCount, StyleTheme } from '@/lib/types';
import { conductResearch } from '@/lib/research-engine';
import { generateWithAI } from '@/lib/ai-generator';
import { checkQuality } from '@/lib/quality-checker';
import { optimizeSlides } from '@/lib/self-optimizer';
import { cachePreview } from '../generate/route';
import { enrichWithImages } from '@/lib/image-service';

export async function POST(req: NextRequest) {
  const { topic, description, pageCount, theme, scenes } = await req.json() as {
    topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string;
  };

  try {
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

    const previewId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cachePreview(previewId, await enrichWithImages(slides, topic));

    return NextResponse.json({
      previewId, slides, issues, score,
      research: {
        summary: research.summary,
        keyStats: research.keyStats,
        findingsCount,
        sourcesCount: new Set(research.results.flatMap(r => r.findings.map(f => f.source))).size,
      },
    });
  } catch (e: unknown) {
    console.error('Preview generation failed:', e);
    return NextResponse.json({ error: (e as Error).message || 'Preview failed' }, { status: 500 });
  }
}
