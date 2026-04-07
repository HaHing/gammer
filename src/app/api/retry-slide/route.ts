import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SlideContent, StyleTheme } from '@/lib/types';
import { safeParseJSON } from '@/lib/research-engine';
import { getCachedPreview, cachePreview } from '../generate/route';

const client = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { previewId, slideIndex, instruction, theme } = await req.json() as {
    previewId: string; slideIndex: number; instruction: string; theme: StyleTheme;
  };

  const slides = getCachedPreview(previewId);
  if (!slides) return NextResponse.json({ error: '预览已过期，请重新生成' }, { status: 404 });
  if (slideIndex < 0 || slideIndex >= slides.length) return NextResponse.json({ error: '页码无效' }, { status: 400 });

  const current = slides[slideIndex];
  const prev = slideIndex > 0 ? slides[slideIndex - 1] : null;
  const next = slideIndex < slides.length - 1 ? slides[slideIndex + 1] : null;

  try {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `重新生成演示文稿的第${slideIndex + 1}页（共${slides.length}页）。

## 用户指令
${instruction}

## 当前内容
${JSON.stringify(current, null, 0)}

## 上下文
${prev ? `上一页标题: "${prev.title}"` : '这是第一页'}
${next ? `下一页标题: "${next.title}"` : '这是最后一页'}
主题风格: ${theme}

## 要求
1. 根据用户指令修改内容，保持与前后页的逻辑连贯
2. 标题必须是有观点的结论句
3. 可用layout: full-text, metrics-grid, chart-focus, two-column, three-column, big-number, quote-highlight, table-focus
4. table-focus需要tableData: {headers: string[], rows: string[][]}
5. needsImage始终为false
6. notes必须有（150-250字）
7. 直接返回JSON对象（不是数组），第一个字符必须是 {`
      }],
    });

    const text = (res.content[0] as { type: string; text: string }).text;
    const data = safeParseJSON(text) as SlideContent | null;
    if (!data || !data.title) {
      return NextResponse.json({ error: 'AI 返回格式错误' }, { status: 500 });
    }

    data.needsImage = false;
    if (!data.layout) data.layout = 'full-text';
    if (!data.type) data.type = current.type;

    // Update the cached slides
    slides[slideIndex] = data;
    cachePreview(previewId, slides);

    return NextResponse.json({ slide: data, slideIndex });
  } catch (e) {
    console.error('Retry slide failed:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
