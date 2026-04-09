import { NextRequest } from 'next/server';
import type { PageCount, StyleTheme, SlideContent, OutlineItem } from '@/lib/types';
import { conductResearch } from '@/lib/research-engine';
import { generateSlidesStreaming } from '@/lib/ai-generator';
import { checkQuality } from '@/lib/quality-checker';
import { optimizeSlides } from '@/lib/self-optimizer';
import { cachePreview } from '../generate/route';
import { getCachedResearch } from '../outline/route';

export async function POST(req: NextRequest) {
  const { topic, description, pageCount, theme, scenes, outline, researchId } = await req.json() as {
    topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string;
    outline?: OutlineItem[]; researchId?: string;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Research — reuse cached or conduct new
        send('status', { phase: 'research', message: '正在搜索权威数据源...' });
        let research = researchId ? getCachedResearch(researchId) : undefined;

        if (!research) {
          // If outline was edited, use outline titles as additional search context
          const outlineContext = outline ? outline.map(o => o.title).join('，') : '';
          research = await conductResearch(topic, `${description || ''} ${outlineContext}`, scenes || '', pageCount);
        } else if (outline) {
          // Targeted re-search for user-modified outline items
          send('status', { phase: 'research', message: '针对大纲调整补充检索...' });
          const supplemental = await conductResearch(
            topic,
            outline.map(o => `${o.title}: ${o.bullets.join('; ')}`).join('\n'),
            scenes || '', pageCount
          );
          // Merge: keep original + add new findings
          const existingSources = new Set(research.results.flatMap(r => r.findings.map(f => f.fact)));
          const newFindings = supplemental.results.flatMap(r => r.findings).filter(f => !existingSources.has(f.fact));
          if (newFindings.length > 0) {
            research.results[0].findings.push(...newFindings);
          }
          const existingStats = new Set(research.keyStats.map(s => s.metric));
          supplemental.keyStats.forEach(s => { if (!existingStats.has(s.metric)) research!.keyStats.push(s); });
        }

        send('research', {
          summary: research.summary,
          keyStats: research.keyStats,
          findingsCount: research.results[0]?.findings?.length || 0,
          sourcesCount: new Set(research.results.flatMap(r => r.findings.map(f => f.source))).size,
        });

        // Phase 2: Generate with outline guidance
        send('status', { phase: 'generating', message: 'AI 正在生成专业内容...' });
        let slides: SlideContent[] = [];
        let slideIndex = 0;

        // Pass outline to generator as additional context in description
        const outlineGuide = outline
          ? `\n\n## 用户确认的大纲（必须严格按此结构生成）\n${outline.map((o, i) => `P${i + 1} [${o.type}/${o.layout}] ${o.title}\n  要点: ${o.bullets.join(' | ')}`).join('\n')}`
          : '';

        await generateSlidesStreaming(
          topic, (description || '') + outlineGuide, pageCount, theme, scenes || '', research,
          (slide) => { slides.push(slide); send('slide', { index: slideIndex++, slide }); }
        );

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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
