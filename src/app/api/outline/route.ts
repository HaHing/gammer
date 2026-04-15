import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { PageCount, StyleTheme, OutlineItem } from '@/lib/types';
import { conductResearch, safeParseJSONArray } from '@/lib/research-engine';
import type { ResearchReport } from '@/lib/research-engine';

const client = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

// Cache research for reuse in generation phase
const researchCache = new Map<string, ResearchReport>();
export function getCachedResearch(id: string) { return researchCache.get(id); }

export async function POST(req: NextRequest) {
  const { topic, description, pageCount, theme: _theme, scenes } = await req.json() as {
    topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string;
  };

  try {
    // Phase 1: Research
    const research = await conductResearch(topic, description || '', scenes || '', pageCount);
    const researchId = `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    researchCache.set(researchId, research);
    setTimeout(() => researchCache.delete(researchId), 60 * 60 * 1000);

    // Phase 2: Generate outline only (fast, no full content)
    const stats = research.keyStats.slice(0, 8).map(s => `${s.metric}: ${s.value} (${s.source})`).join('\n');
    const findings = research.results.flatMap(r => r.findings).slice(0, 12).map(f => `${f.fact} (${f.source})`).join('\n');

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `为"${topic}"设计严格${pageCount}页的PPT大纲。

描述: ${description || '无'}
场景: ${scenes || '通用'}

## 研究数据
${stats}
${findings}

## 要求
- 严格${pageCount}个元素的JSON数组
- 每个元素: {"title":"有观点的结论句标题","bullets":["要点1","要点2","要点3"],"type":"slide类型","layout":"布局"}
- type: cover/toc/content/data/comparison/timeline/summary/action
- layout: full-text/metrics-grid/chart-focus/two-column/three-column/big-number/quote-highlight/table-focus/icon-grid/process-flow/funnel/pyramid/problem-solution/highlight/diagram
- ⚠️ 当内容涉及架构、流程、拓扑、层级关系时，必须使用 diagram layout，不要用 full-text 堆文字
- 当layout为diagram时，bullets中用结构化描述（如"用户请求→Agent协调→子Agent执行→结果聚合→输出"）
- title必须是有观点的结论句，不是"概述"
- bullets 3-5条，每条20-40字，概括要讲的内容方向
- 第一页必须是cover，最后一页必须是summary/action
- 所有数据必须来自权威机构和官方来源
- 直接返回JSON数组，第一个字符必须是 [`
      }],
    });

    const res = await stream.finalMessage();
    let text = '';
    for (const block of res.content) { if (block.type === 'text') text += block.text; }

    const outline = safeParseJSONArray(text) as OutlineItem[] | null;
    if (!outline || outline.length === 0) throw new Error('大纲生成失败');

    // Normalize
    outline.forEach((item, i) => {
      if (i === 0) item.type = 'cover';
      if (i === outline.length - 1 && !['summary', 'action'].includes(item.type)) item.type = 'summary';
      if (!item.type) item.type = 'content';
      if (!item.layout) item.layout = 'full-text';
      if (!item.bullets) item.bullets = [];
    });
    while (outline.length < pageCount) outline.push({ title: '待补充', bullets: [], type: 'content', layout: 'full-text' });
    if (outline.length > pageCount) outline.length = pageCount;

    return NextResponse.json({
      outline,
      researchId,
      research: {
        summary: research.summary,
        keyStats: research.keyStats,
        findingsCount: research.results[0]?.findings?.length || 0,
        sourcesCount: new Set(research.results.flatMap(r => r.findings.map(f => f.source))).size,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
