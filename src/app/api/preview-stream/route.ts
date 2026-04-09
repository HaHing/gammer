import { NextRequest } from 'next/server';
import type { PageCount, StyleTheme, SlideContent } from '@/lib/types';
import { conductResearch } from '@/lib/research-engine';
import { generateSlidesStreaming } from '@/lib/ai-generator';
import { checkQuality } from '@/lib/quality-checker';
import { optimizeSlides } from '@/lib/self-optimizer';
import { cachePreview } from '../generate/route';

export async function POST(req: NextRequest) {
  const { topic, description, pageCount, theme, scenes } = await req.json() as {
    topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Research
        send('status', { phase: 'research', message: '正在搜索权威数据源...' });
        const research = await conductResearch(topic, description || '', scenes || '', pageCount);
        const findingsCount = research.results[0]?.findings?.length || 0;
        send('research', {
          summary: research.summary,
          keyStats: research.keyStats,
          findingsCount,
          sourcesCount: new Set(research.results.flatMap(r => r.findings.map(f => f.source))).size,
        });

        // Phase 2: AI Generation (streaming slides)
        send('status', { phase: 'generating', message: 'AI 正在生成专业内容...' });
        let slides: SlideContent[] = [];
        let slideIndex = 0;
        await generateSlidesStreaming(topic, description || '', pageCount, theme, scenes || '', research, (slide) => {
          slides.push(slide);
          send('slide', { index: slideIndex++, slide });
        });

        // Phase 3: Quality check
        send('status', { phase: 'checking', message: '质量检查中...' });
        let { issues, score } = checkQuality(slides);

        if (score < 80 || issues.some(i => i.severity === 'error')) {
          send('status', { phase: 'optimizing', message: '优化内容中...' });
          slides = await optimizeSlides(slides, issues, score, pageCount, theme);
          const recheck = checkQuality(slides);
          issues = recheck.issues;
          score = recheck.score;
        }

        const previewId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        cachePreview(previewId, slides);
        send('done', { previewId, slides, issues, score });
      } catch (e) {
        send('error', { message: (e as Error).message || 'Generation failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
