import { NextRequest } from 'next/server';
import type { PageCount, StyleTheme, SlideContent, OutlineItem } from '@/lib/types';
import { conductResearch } from '@/lib/research-engine';
import type { ResearchReport } from '@/lib/research-engine';
import { generateSlidesStreaming } from '@/lib/ai-generator';
import { checkQuality } from '@/lib/quality-checker';
import { optimizeSlides } from '@/lib/self-optimizer';
import { buildDeliveryPackage } from '@/lib/delivery-package';
import { cachePreview } from '../generate/route';
import { getCachedResearch } from '../outline/route';
import { auth } from '@/lib/auth';
import { QuotaExceededError, ensureQuotaForPages, consumeQuotaPages, getQuotaStatus } from '@/lib/quota';

function normalizeUserFacingErrorMessage(rawMessage: string): { message: string; code?: string; retryable?: boolean } {
  const msg = rawMessage || 'Generation failed';

  if (/invalid\s+`.*prisma|unknown field\s+`?(role|pagequota|pageused)`?/i.test(msg)) {
    return {
      message: '服务配置正在热更新，请刷新页面后重试；如果仍失败，请重启服务。',
      code: 'SERVER_SCHEMA_MISMATCH',
      retryable: true,
    };
  }

  if (/(429|too many requests|rate limit|response\.failed|timed out|timeout|503|502|504|overloaded)/i.test(msg)) {
    return {
      message: `模型服务繁忙（可重试）：${msg}. 建议等待10-20秒后重试。`,
      retryable: true,
    };
  }

  return { message: msg };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('event: error\ndata: {"message":"Unauthorized"}\n\n', {
      status: 401,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }
  const userId = session.user.id;

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
        await ensureQuotaForPages(userId, pageCount);
        // Phase 1: Research — reuse cached or conduct new
        send('status', { phase: 'research', message: '正在搜索权威数据源...' });
        send('log', { text: `🔍 开始研究主题: "${topic}"` });
        let research = researchId ? getCachedResearch(researchId, userId) ?? null : null;

        if (!research) {
          const outlineContext = outline ? outline.map(o => o.title).join('，') : '';
          send('log', { text: '📡 执行深度网络搜索（10+ 查询）...' });
          research = await conductResearch(topic, `${description || ''} ${outlineContext}`, scenes || '', pageCount);
          send('log', { text: `✓ 搜索完成: ${research.results[0]?.findings?.length || 0} 条发现, ${research.keyStats.length} 个关键数据` });
        } else if (outline) {
          const r = JSON.parse(JSON.stringify(research)) as ResearchReport;
          send('log', { text: '📋 检测到大纲调整，执行补充检索...' });
          send('status', { phase: 'research', message: '针对大纲调整补充检索...' });
          const supplemental = await conductResearch(
            topic,
            outline.map(o => `${o.title}: ${o.bullets.join('; ')}`).join('\n'),
            scenes || '', pageCount
          );
          const existingSources = new Set(r.results.flatMap(x => x.findings.map(f => f.fact)));
          const newFindings = supplemental.results.flatMap(x => x.findings).filter(f => !existingSources.has(f.fact));
          if (newFindings.length > 0) r.results[0].findings.push(...newFindings);
          const existingStats = new Set(r.keyStats.map(s => s.metric));
          supplemental.keyStats.forEach(s => { if (!existingStats.has(s.metric)) r.keyStats.push(s); });
          research = r;
          send('log', { text: `✓ 补充检索完成: +${newFindings.length} 条新发现` });
        }

        send('research', {
          summary: research.summary,
          keyStats: research.keyStats,
          findingsCount: research.results[0]?.findings?.length || 0,
          sourcesCount: new Set(research.results.flatMap(r => r.findings.map(f => f.source))).size,
          topSources: [...new Set(research.results.flatMap(r => r.findings.map(f => f.source)))].slice(0, 8),
        });
        const sources = [...new Set(research.results.flatMap(r => r.findings.map(f => f.source)))].slice(0, 5);
        sources.forEach(s => send('log', { text: `📊 数据来源: ${s}` }));

        // Phase 2: Generate with outline guidance
        send('status', { phase: 'generating', message: 'AI 正在生成专业内容...' });
        send('log', { text: `✍️ 开始生成 ${pageCount} 页内容...` });
        let slides: SlideContent[] = [];
        let slideIndex = 0;

        await generateSlidesStreaming(
          topic, description || '', pageCount, theme, scenes || '', research,
          (slide) => { slides.push(slide); send('slide', { index: slideIndex++, slide }); send('log', { text: `✓ 第 ${slideIndex} 页: ${slide.title?.slice(0, 30) || ''}...` }); },
          outline || undefined
        );

        // Enforce page count: truncate or pad
        if (slides.length > pageCount) slides = slides.slice(0, pageCount);
        while (slides.length < pageCount) {
          slides.push({ type: 'content', layout: 'full-text', title: `补充内容 ${slides.length + 1}`, bullets: ['待补充'], needsImage: false });
        }

        // Phase 3: Quality check
        send('status', { phase: 'checking', message: '质量检查中...' });
        send('log', { text: '✅ 开始质量检查...' });
        let { issues, score } = checkQuality(slides);
        send('log', { text: `质量评分: ${score}分, ${issues.length} 个问题` });

        if (score < 80 || issues.some(i => i.severity === 'error')) {
          send('status', { phase: 'optimizing', message: '优化内容中...' });
          send('log', { text: '⚡ 评分不足80，启动自动优化...' });
          slides = await optimizeSlides(slides, issues, score, pageCount, theme);
          const recheck = checkQuality(slides);
          issues = recheck.issues;
          score = recheck.score;
        }

        await consumeQuotaPages(userId, slides.length || pageCount);
        const quota = await getQuotaStatus(userId);
        const previewId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const delivery = buildDeliveryPackage({
          topic,
          theme,
          pageCount,
          slides,
          issues,
          score,
          research,
        });

        cachePreview(previewId, userId, slides);
        send('log', { text: `🎉 生成完成! ${slides.length} 页, 质量评分 ${score}分` });
        send('done', { previewId, slides, issues, score, delivery, quota });
      } catch (e) {
        if (e instanceof QuotaExceededError) {
          send('error', { message: e.message, code: 'QUOTA_EXCEEDED', quota: e.detail });
          return;
        }
        const normalized = normalizeUserFacingErrorMessage((e as Error).message || 'Generation failed');
        send('error', normalized);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
