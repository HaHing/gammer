import Anthropic from '@anthropic-ai/sdk';
import type { PageCount, StyleTheme, SlideContent } from './types';
import type { ResearchReport } from './research-engine';
import { safeParseJSONArray } from './research-engine';
import { themeDesigns } from './theme-design';

const client = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

const STYLE_GUIDES: Record<string, string> = {
  google: `Google风格：极简留白>40%，单一论点聚焦。大号数字+简短标签。#1A73E8蓝+#34A853绿+#EA4335红，白底。Sans-serif。图表简洁扁平。`,
  amazon: `Amazon风格：高信息密度，六页纸叙事。每页5-7要点含数据。#FF9900橙+#232F3E深蓝灰。少装饰，数据图表为主。`,
  microsoft: `Microsoft风格：层次分明，标题→副标题→要点→数据。#0078D4蓝+#505050灰。图标体系完整，渐变色块分区。`,
  deloitte: `Deloitte风格：咨询级严谨，每条数据标注来源。脚注完整。#86BC25绿+#000000黑。矩阵图、象限图。每页必须有source。`,
  pwc: `PwC风格：暖色调#D04A02橙红+#2D2D2D深灰。结构化表达，编号分层。数据可视化突出。`,
  brand: `品牌紫色系：渐变紫色科技感，现代简约。主色紫+白+浅灰。适合对外展示，视觉冲击力强。`,
  haio: `Haio极简商务：深色封面(#1B1F2A)+浅灰内容页(#FAFBFC)。卡片式布局，白色卡片+左侧蓝色边条+阴影。高信息密度，小字体。蓝#2563EB+灰#4F5565+青#0D9488。适合正式商务汇报。`,
};

function getStructureGuide(pageCount: PageCount): string {
  const guides: Record<PageCount, string> = {
    5: `5页精简：P1封面(必须配图) → P2核心问题(big-number/metrics-grid震撼开场) → P3解决方案(chart-focus/two-column) → P4数据验证(metrics-grid/chart-focus) → P5结论行动(summary)。每页信息密度极高，至少4个bullets或2个keyMetrics。`,
    10: `10页标准：P1封面 → P2目录 → P3-4现状与问题 → P5-6方案与论证 → P7-8数据与对比 → P9总结 → P10行动。完整论证链，每个论点有数据支撑。`,
    15: `15页详细：P1封面 → P2目录 → P3执行摘要 → P4-6现状深度分析 → P7-9方案详述 → P10-11数据验证 → P12路线图 → P13风险 → P14总结 → P15行动。每维度2-3页。`,
    20: `20页深度：P1封面 → P2目录 → P3执行摘要 → P4-7全面现状 → P8-12方案多维论证 → P13-15数据对比 → P16架构/路线图 → P17-18风险应对 → P19总结 → P20行动。多维度深度分析。`,
    25: `25页完整：P1封面 → P2目录 → P3执行摘要 → P4-5行业背景 → P6-9深度现状 → P10-14方案全面论证 → P15-17数据验证对比 → P18技术架构 → P19路线图 → P20-21资源预算 → P22-23风险 → P24总结 → P25行动。完整咨询报告。`,
  };
  return guides[pageCount];
}

function buildSystemPrompt(theme: StyleTheme, pageCount: PageCount): string {
  const design = themeDesigns[theme] || themeDesigns.google;
  return `你是McKinsey/BCG级别的咨询顾问。生成严格${pageCount}页的专业演示文稿。

## 方法论
- 金字塔原理：结论先行→论据→数据佐证
- So What：每页标题必须是有观点的结论句（如"市场突破万亿，三朵云格局已定"）
- 数据说话：每个论点必须有研究数据支撑，严禁编造
- 高密度：每页必须内容饱满，严禁留白。至少5条bullets或3个keyMetrics+3条bullets

## 风格：${STYLE_GUIDES[theme] || STYLE_GUIDES.google}

## 主题偏好布局（优先使用）：${design.preferredLayouts.join(', ')}
## 图表偏好：${design.chartPreference}（市场份额数据用pie/doughnut，趋势数据用line，对比数据用bar）
## 指标展示风格：${design.metricsStyle}

## 结构：${getStructureGuide(pageCount)}

## 布局（layout）— 智能选择指南
full-text(5-7条详细bullets) | metrics-grid(需keyMetrics 2-4个+3条bullets) | chart-focus(需chartData 3-8个+insight+3条bullets) | two-column(每列3-4条bullets，适合对比/分类) | three-column(每列2-3条bullets，适合3个维度) | big-number(需keyMetrics 1个+4条bullets，适合震撼开场) | quote-highlight(insight+4条bullets，适合引用/结论) | table-focus(需tableData 4-8行+insight) | icon-grid(3-6个bullets，每条以emoji开头，适合功能/特性展示) | process-flow(3-6个bullets，按步骤顺序，适合流程/方法论) | funnel(3-5个bullets，从大到小排列，适合转化/筛选)

### 布局选择规则
- 有大量数字对比 → metrics-grid 或 big-number
- 有时序/步骤 → process-flow 或 timeline type
- 有分类/对比 → two-column 或 three-column
- 有表格数据 → table-focus
- 有图表数据 → chart-focus
- 有核心引用/结论 → quote-highlight
- 有功能/特性列表 → icon-grid
- 有转化漏斗/筛选 → funnel
- 通用内容 → full-text

## 字段
- type：cover/toc/content/data/comparison/timeline/summary/action
- title：≤25字，有观点的结论句，不是"概述"而是"市场突破万亿"
- subtitle：So What一句话，含数据
- bullets：每条80-150字，必须含具体数字+分析洞察+因果逻辑，不要泛泛而谈。每页至少4条
- keyMetrics：[{label,value,unit,trend}]，数字必须来自研究数据
- chartData：[{label,value(数字)}]，数据必须真实
- chartType：bar(默认)/pie/doughnut/line — 市场份额用pie/doughnut，趋势用line，对比用bar
- tableData：{headers:string[], rows:string[][]}，4-8行详细数据
- insight：核心洞察一句话，必须含数据
- source：数据来源机构名
- notes：演讲者备注150-250字，含讲解要点和补充数据
- needsImage：始终false

## 约束
- 严格${pageCount}页，最后一页必须是summary/action
- 连续两页不能相同layout，至少5种不同layout
- 所有数据来自研究报告，不得编造
- 每页内容必须饱满：bullets≥4条 或 keyMetrics≥3个 或 tableData≥4行`;
}

function buildUserPrompt(
  topic: string, description: string, pageCount: PageCount, scenes: string, research: ResearchReport | null
): string {
  let researchSection = '';
  if (research && research.keyStats.length > 0) {
    const findings = research.results.flatMap(r => r.findings);
    researchSection = `

## 研究数据（你必须引用这些真实数据，严禁编造）

### 研究概述
${research.summary}

### 关键指标（${research.keyStats.length}个）— 必须全部在PPT中展示
${research.keyStats.map(s => `- ${s.metric}: ${s.value} (${s.source})`).join('\n')}

### 详细发现（${findings.length}条）— 选择最相关的融入内容
${findings.map(f => `- ${f.fact} (${f.source}${f.url ? `, ${f.url}` : ''})`).join('\n')}`;

    if (research.contentStrategy) {
      researchSection += ``;
    }

    researchSection += `

### 数据使用要求
1. keyStats中的数据必须全部出现在PPT中（分布在不同页面的keyMetrics/bullets/chartData中）
2. 每页至少引用1-2条findings中的数据
3. 数据来源必须标注在source字段
4. chartData的value必须是数字，从findings中提取真实数值
5. 不要编造任何数据，如果研究数据不足，用定性描述代替`;
  }

  return `为"${topic}"设计严格 ${pageCount} 页的专业演示文稿。

描述: ${description || '（基于研究数据自行规划叙事线）'}
场景: ${scenes || '通用汇报'}
${researchSection}

## 输出要求
1. 返回JSON数组，严格 ${pageCount} 个元素
2. 不要markdown代码块，第一个字符必须是 [
3. 紧凑JSON格式
4. null字段可省略，空数组用[]`;
}

export async function generateWithAI(
  topic: string, description: string, pageCount: PageCount,
  theme: StyleTheme, scenes: string, research: ResearchReport | null
): Promise<SlideContent[]> {
  console.log(`[AI] Generating ${pageCount} slides, theme=${theme}`);
  console.log(`[AI] Research: ${research?.keyStats.length || 0} stats, ${research?.results[0]?.findings?.length || 0} findings`);

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 30000,
      system: buildSystemPrompt(theme, pageCount),
      messages: [{ role: 'user', content: buildUserPrompt(topic, description, pageCount, scenes, research) }],
    });

    const res = await stream.finalMessage();
    let rawText = '';
    for (const block of res.content) {
      if (block.type === 'text') rawText += block.text;
    }
    console.log(`[AI] Attempt ${attempt + 1}: ${rawText.length} chars, stop=${res.stop_reason}`);
    console.log(`[AI] First 200 chars: ${rawText.substring(0, 200)}`);

    const slides = safeParseJSONArray(rawText) as SlideContent[] | null;
    if (slides && slides.length > 0) {
      // Normalize
      slides.forEach((s, i) => {
        s.needsImage = false;
        if (!s.layout) s.layout = 'full-text';
        // Map AI's "page" field to proper type if missing
        if (!s.type) {
          const p = (s as unknown as Record<string, unknown>).page;
          if (i === 0) s.type = 'cover';
          else if (i === slides.length - 1) s.type = 'summary';
          else if (p === 2 && pageCount >= 10) s.type = 'toc';
          else s.type = 'content';
        }
        if (i === 0 && s.type !== 'cover') s.type = 'cover';
        if (s.keyMetrics) s.keyMetrics = s.keyMetrics.filter(m => m.label && m.value);
        if (s.chartData) s.chartData = s.chartData.filter(d => d.label && typeof d.value === 'number');
        if (s.chartType && !['bar', 'pie', 'doughnut', 'line'].includes(s.chartType)) delete s.chartType;
        if (s.tableData && (!s.tableData.headers?.length || !s.tableData.rows?.length)) delete s.tableData;
        // Auto-fill missing or empty notes
        if ((!s.notes || s.notes.length < 20) && !['cover', 'toc'].includes(s.type)) {
          const parts = [`本页核心：${s.title || ''}`];
          if (s.subtitle) parts.push(s.subtitle);
          if (s.insight) parts.push(`关键洞察：${s.insight}`);
          if (s.source) parts.push(`数据来源：${s.source}`);
          s.notes = parts.join('。');
        }
      });

      while (slides.length < pageCount) {
        slides.push({ type: 'content', layout: 'full-text', title: '补充内容', bullets: ['待完善'], needsImage: false });
      }
      if (slides.length > pageCount) slides.length = pageCount;

      // Ensure last slide is summary/action
      const last = slides[slides.length - 1];
      if (last && !['summary', 'action'].includes(last.type)) {
        last.type = 'summary';
      }

      const imgCount = slides.filter(s => s.needsImage).length;
      const layouts = [...new Set(slides.map(s => s.layout))];
      console.log(`[AI] ✓ ${slides.length} slides, ${imgCount} need images, ${layouts.length} layouts: ${layouts.join(', ')}`);
      return slides;
    }

    console.error(`[AI] Attempt ${attempt + 1} parse failed. First 500 chars:`, rawText.substring(0, 500));
    if (attempt === 0) console.log('[AI] Retrying...');
  }

  throw new Error('AI 未返回有效的 JSON 数组');
}
