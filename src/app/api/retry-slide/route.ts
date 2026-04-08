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

  console.log(`[Retry] previewId=${previewId}, slide=${slideIndex}, instruction="${instruction}"`);

  let slides = getCachedPreview(previewId);
  if (!slides) {
    console.log('[Retry] Cache miss — trying to reconstruct from request');
    // If cache expired, return specific error code so frontend can handle it
    return NextResponse.json({ error: '预览缓存已过期，请重新点击"预览内容"后再编辑', expired: true }, { status: 410 });
  }
  if (slideIndex < 0 || slideIndex >= slides.length) {
    return NextResponse.json({ error: '页码无效' }, { status: 400 });
  }

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
2. 标题必须是有观点的结论句，含数据
3. bullets每条80-150字，含具体数字+分析洞察，至少4条
4. 可用layout: full-text, metrics-grid, chart-focus, two-column, three-column, big-number, quote-highlight, table-focus
5. table-focus需要tableData: {headers: string[], rows: string[][]}，至少4行
6. needsImage始终为false
7. notes必须有（150-250字）
8. 内容必须饱满，严禁留白
9. 直接返回JSON对象，第一个字符必须是 { ，不要markdown代码块`
      }],
    });

    // Extract text from all content blocks (proxy may merge noise into text)
    let rawText = '';
    for (const block of res.content) {
      if (block.type === 'text') rawText += block.text;
    }
    console.log(`[Retry] AI response: ${rawText.length} chars`);
    console.log(`[Retry] First 200 chars: ${rawText.substring(0, 200)}`);

    let data = safeParseJSON(rawText) as SlideContent | null;
    if (!data || !data.title) {
      console.log(`[Retry] JSON parse failed. Raw (500): ${rawText.substring(0, 500)}`);
      // Retry: ask AI to output clean JSON
      try {
        const fix = await client.messages.create({
          model: 'claude-sonnet-4-20250514', max_tokens: 4000,
          messages: [{ role: 'user', content: `将以下内容转为有效JSON对象。第一个字符必须是{，不要代码块：\n${rawText.substring(0, 3000)}` }],
        });
        let fixText = '';
        for (const b of fix.content) { if (b.type === 'text') fixText += b.text; }
        data = safeParseJSON(fixText) as SlideContent | null;
        if (data?.title) console.log('[Retry] ✓ JSON fixed by AI');
      } catch { /* ignore */ }
      if (!data || !data.title) {
        return NextResponse.json({ error: 'AI 返回格式错误，请重试' }, { status: 500 });
      }
    }

    data.needsImage = false;
    if (!data.layout) data.layout = 'full-text';
    if (!data.type) data.type = current.type;

    // Update the cached slides
    slides[slideIndex] = data;
    cachePreview(previewId, slides);
    console.log(`[Retry] ✓ Updated slide ${slideIndex}: "${data.title}" (${data.layout})`);

    return NextResponse.json({ slide: data, slideIndex });
  } catch (e) {
    console.error('[Retry] Failed:', (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
