import { NextRequest, NextResponse } from 'next/server';
import type { PageCount, StyleTheme, SlideContent } from '@/lib/types';
import { generatePptx } from '@/lib/pptx-engine';
import { conductResearch } from '@/lib/research-engine';
import { generateWithAI } from '@/lib/ai-generator';

const previewCache = new Map<string, SlideContent[]>();

export function cachePreview(id: string, slides: SlideContent[]) {
  previewCache.set(id, slides);
  setTimeout(() => previewCache.delete(id), 30 * 60 * 1000);
}

export function getCachedPreview(id: string): SlideContent[] | undefined {
  return previewCache.get(id);
}

export async function POST(req: NextRequest) {
  let body: { topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string; previewId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  const { topic, description, pageCount, theme, scenes, previewId } = body;

  try {
    let slides: SlideContent[];
    if (previewId && previewCache.has(previewId)) {
      slides = previewCache.get(previewId)!;
    } else {
      const research = await conductResearch(topic, description || '', scenes || '');
      slides = await generateWithAI(topic, description || '', pageCount, theme, scenes || '', research);
    }

    const buffer = await generatePptx(slides, theme, topic);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(topic)}.pptx"`,
      },
    });
  } catch (e: unknown) {
    console.error('PPTX generation failed:', e);
    return NextResponse.json({ error: (e as Error).message || 'Generation failed' }, { status: 500 });
  }
}
