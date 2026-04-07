import Anthropic from '@anthropic-ai/sdk';
import type { SlideContent, PageCount, StyleTheme } from './types';
import { safeParseJSONArray } from './research-engine';

const client = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

interface QualityIssue {
  page: number;
  issue: string;
  severity: 'error' | 'warning';
}

// Self-optimization: analyze generated slides and fix critical issues
export async function optimizeSlides(
  slides: SlideContent[], issues: QualityIssue[], score: number,
  pageCount: PageCount, theme: StyleTheme
): Promise<SlideContent[]> {
  // Only optimize if score is below threshold or there are errors
  const errors = issues.filter(i => i.severity === 'error');
  if (score >= 85 && errors.length === 0) {
    console.log(`[Optimizer] Score ${score} >= 85, no errors, skipping`);
    return slides;
  }

  console.log(`[Optimizer] Score ${score}, ${errors.length} errors, ${issues.length} total issues. Optimizing...`);

  const issuesSummary = issues.map(i => `P${i.page} [${i.severity}]: ${i.issue}`).join('\n');
  const slidesJSON = JSON.stringify(slides.map(s => ({
    type: s.type, layout: s.layout, title: s.title, subtitle: s.subtitle,
    bullets: s.bullets, keyMetrics: s.keyMetrics, chartData: s.chartData,
    insight: s.insight, source: s.source, needsImage: s.needsImage,
  })), null, 0);

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: `你是PPT质量优化专家。以下是一份${pageCount}页演示文稿的质量检查结果。请修复所有问题。

## 质量评分: ${score}/100

## 问题列表
${issuesSummary}

## 当前内容
${slidesJSON}

## 修复要求
1. 修复所有 error 级别问题
2. 尽量修复 warning 级别问题
3. 保持原有内容的核心信息不变
4. 确保标题都是有观点的结论句
5. 确保 metrics-grid 布局有 keyMetrics，chart-focus 有 chartData
6. 确保连续两页不用相同 layout
7. 确保至少 5 种不同 layout
8. 不要改变页数（严格 ${pageCount} 页）

直接返回修复后的完整 JSON 数组，不要代码块，第一个字符必须是 [`
      }],
    });

    const res = await stream.finalMessage();
    let text = '';
    for (const block of res.content) {
      if (block.type === 'text') text += block.text;
    }

    const optimized = safeParseJSONArray(text) as SlideContent[] | null;
    if (optimized && optimized.length === pageCount) {
      // Preserve image data from original slides
      optimized.forEach((s, i) => {
        if (slides[i]?.imageUrl) s.imageUrl = slides[i].imageUrl;
        s.needsImage = !!s.needsImage;
        if (!s.layout) s.layout = 'full-text';
        if (!s.type) s.type = 'content';
      });
      console.log(`[Optimizer] ✓ Optimized ${pageCount} slides`);
      return optimized;
    }
    console.log(`[Optimizer] Parse failed or wrong count (${optimized?.length}), keeping original`);
  } catch (e) {
    console.error('[Optimizer] Failed:', (e as Error).message);
  }
  return slides;
}
