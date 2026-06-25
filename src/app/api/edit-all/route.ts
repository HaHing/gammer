import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/model';
import type { SlideContent, StyleTheme } from '@/lib/types';
import { safeParseJSONArray } from '@/lib/research-engine';
import { retryAsync, getErrorMessage } from '@/lib/retry';
import { auth } from '@/lib/auth';
import { getCachedPreview, cachePreview } from '../generate/route';


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { previewId, instruction, theme: _theme } = await req.json() as {
    previewId: string; instruction: string; theme: StyleTheme;
  };

  const slides = getCachedPreview(previewId, userId);
  if (!slides) {
    return NextResponse.json({ error: '预览缓存已过期，请重新点击"预览内容"', expired: true }, { status: 410 });
  }

  try {
    const res = await retryAsync(
      async () => anthropic.messages.create({
        model: MODEL,
        max_tokens: 20000,
        messages: [{
          role: 'user',
          content: `对以下${slides.length}页演示文稿执行全局修改。

## 用户指令
${instruction}

## 当前内容
${JSON.stringify(slides.map(s => ({ type: s.type, layout: s.layout, title: s.title, subtitle: s.subtitle, bullets: s.bullets, keyMetrics: s.keyMetrics, chartData: s.chartData, chartType: s.chartType, insight: s.insight, source: s.source, tableData: s.tableData })), null, 0)}

## 要求
1. 根据用户指令修改所有相关页面
2. 保持页数不变（严格${slides.length}页）
3. 保持整体叙事逻辑连贯
4. needsImage始终为false
5. 直接返回完整JSON数组，第一个字符必须是 [，不要markdown代码块`
        }],
      }),
      {
        attempts: 3,
        baseDelayMs: 900,
        onRetry: (error, attempt, delayMs) => {
          console.warn(`[EditAll] retry ${attempt}/3 in ${delayMs}ms: ${getErrorMessage(error).substring(0, 120)}`);
        },
      }
    );
    let text = '';
    for (const block of res.content) {
      if (block.type === 'text') text += block.text;
    }

    const updated = safeParseJSONArray(text) as SlideContent[] | null;
    if (updated && updated.length > 0) {
      updated.forEach(s => {
        s.needsImage = false;
        if (!s.layout) s.layout = 'full-text';
        if (!s.type) s.type = 'content';
      });
      // Ensure same page count
      while (updated.length < slides.length) updated.push(slides[updated.length]);
      if (updated.length > slides.length) updated.length = slides.length;

      cachePreview(previewId, userId, updated);
      return NextResponse.json({ slides: updated });
    }

    return NextResponse.json({ error: 'AI 返回格式错误' }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
