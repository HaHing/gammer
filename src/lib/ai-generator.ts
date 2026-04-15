import Anthropic from '@anthropic-ai/sdk';
import type { PageCount, StyleTheme, SlideContent, OutlineItem } from './types';
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

function buildSystemPrompt(theme: StyleTheme, pageCount: PageCount, outline?: OutlineItem[]): string {
  const design = themeDesigns[theme] || themeDesigns.google;
  const hasOutline = outline && outline.length > 0;

  // When outline exists: outline is THE ONLY structure authority, placed FIRST
  const outlineBlock = hasOutline
    ? `## ⚠️ 必须严格遵循的大纲（最高优先级）
严格按照以下${outline.length}页大纲生成。不得修改标题方向、不得调整顺序、不得增减页数。
每页的type和layout必须与大纲一致。内容必须围绕大纲要点展开。

${outline.map((o, i) => `第${i + 1}页 [${o.type}/${o.layout}] ${o.title}
  → ${o.bullets.join(' | ')}`).join('\n')}\n\n`
    : '';

  return `${outlineBlock}你是McKinsey/BCG级别的咨询顾问。生成严格${pageCount}页的专业演示文稿。

## 方法论
- 金字塔原理：结论先行→论据→数据佐证
- So What：每页标题必须是有观点的结论句
- 数据说话：每个论点必须有研究数据支撑，严禁编造
- 权威来源：所有数据必须来自权威机构和官方来源（Gartner、IDC、McKinsey、BCG、Forrester、Statista、政府统计局、上市公司财报等），严禁引用博客、论坛、自媒体
- 来源标注：每页source字段标注具体机构名+报告名/年份
- 高密度：每页内容饱满，至少5条bullets或3个keyMetrics+3条bullets

## 风格：${STYLE_GUIDES[theme] || STYLE_GUIDES.google}

## 主题偏好布局：${design.preferredLayouts.join(', ')}
## 图表偏好：${design.chartPreference}
## 指标展示风格：${design.metricsStyle}

${hasOutline ? '' : `## 结构：${getStructureGuide(pageCount)}`}

## 布局（layout）— 智能选择指南
full-text | metrics-grid | chart-focus | two-column | three-column | big-number | quote-highlight | table-focus | icon-grid | process-flow | funnel | pyramid | problem-solution | highlight | diagram

### 布局选择规则
- 数字对比 → metrics-grid 或 big-number
- 时序/步骤 → process-flow
- 分类/对比 → two-column 或 three-column
- 表格数据 → table-focus
- 图表数据 → chart-focus
- 核心结论 → quote-highlight 或 highlight
- 功能/特性 → icon-grid
- 转化漏斗 → funnel
- 战略-战术-执行 → pyramid（3层金字塔结构）
- 问题-原因-对策 → problem-solution（3栏对比分析）
- 关键数据高亮 → highlight（1个核心数据+解读）
- 架构/流程/关系/网络拓扑 → diagram（AI生成SVG图表）

### diagram 布局专用字段
当 layout 为 "diagram" 时，必须提供 diagramDescription 字段：
- diagramDescription：用自然语言描述图表内容，例如"用户注册流程：输入手机号→发送验证码→验证→创建账户→完成"
- diagramStyle（可选）：blueprint | minimal | corporate | neon | hand-drawn | gradient | monochrome
- 适用场景：系统架构图、业务流程图、组织架构图、技术栈关系图、网络拓扑图、决策树、思维导图
- 每个演示文稿建议1-3页diagram，用于展示复杂关系和流程

## 商务设计规范
- 字体：统一微软雅黑，仅用加粗/标准/细三种字重
- 图标：极简线性风格，不使用emoji
- 图表：少色高对比，突出结论，不做视觉噪音
- 封面：简洁 — 大标题+副标题+日期，避免装饰堆砌
- 色彩：主色用于标题和图表，辅助色用于信息层级，强调色仅用于关键数据

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
- diagramDescription：当layout为diagram时必填，自然语言描述图表内容
- diagramStyle：可选，diagram风格（blueprint/minimal/corporate/neon/hand-drawn/gradient/monochrome）
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

// ─── Layout auto-correction: match layout to actual content ───
function correctLayout(s: SlideContent): void {
  if (['cover', 'toc'].includes(s.type)) return;
  const bulletCount = s.bullets?.length || 0;
  const hasMetrics = (s.keyMetrics?.length || 0) > 0;
  const hasChart = (s.chartData?.length || 0) > 0;
  const hasTable = !!s.tableData?.headers?.length;

  // Estimate content height (in inches, slide usable ~5.4")
  const metricH = hasMetrics ? 1.6 : 0;
  const insightH = s.insight ? 0.8 : 0;
  const bulletH = bulletCount * 0.44;
  const chartH = hasChart ? 2.5 : 0;
  const tableH = hasTable ? Math.min((s.tableData!.rows.length + 1) * 0.38 + 0.2, 3.5) : 0;
  const totalH = metricH + insightH + bulletH + chartH + tableH;

  // Fix: layout requires data that doesn't exist
  if (s.layout === 'chart-focus' && !hasChart) s.layout = hasMetrics ? 'metrics-grid' : 'full-text';
  if (s.layout === 'table-focus' && !hasTable) s.layout = hasMetrics ? 'metrics-grid' : 'full-text';
  if (s.layout === 'big-number' && !hasMetrics) s.layout = 'full-text';
  if (s.layout === 'metrics-grid' && !hasMetrics) s.layout = 'full-text';

  // Fix: too much content for compact layouts
  if (totalH > 5.4) {
    // Content will overflow — switch to a layout that handles density better
    if (hasChart && hasMetrics && bulletCount > 3) {
      // Too much of everything — drop to chart-focus (truncates bullets to 3)
      s.layout = 'chart-focus';
    } else if (bulletCount > 6 && !hasChart && !hasTable) {
      // Many bullets, no visuals — use two-column to save vertical space
      s.layout = 'two-column';
    } else if (bulletCount > 8) {
      s.layout = 'three-column';
    }
  }

  // Fix: too little content for multi-column layouts
  if (s.layout === 'two-column' && bulletCount < 4) s.layout = 'full-text';
  if (s.layout === 'three-column' && bulletCount < 6) s.layout = bulletCount >= 4 ? 'two-column' : 'full-text';
  if (s.layout === 'icon-grid' && bulletCount < 3) s.layout = 'full-text';
  if (s.layout === 'process-flow' && bulletCount < 3) s.layout = 'full-text';
  if (s.layout === 'funnel' && bulletCount < 3) s.layout = 'full-text';
  if (s.layout === 'pyramid' && bulletCount < 3) s.layout = 'full-text';
  if (s.layout === 'problem-solution' && bulletCount < 3) s.layout = 'full-text';
  if (s.layout === 'highlight' && !hasMetrics) s.layout = hasChart ? 'chart-focus' : 'full-text';
}

export async function generateWithAI(
  topic: string, description: string, pageCount: PageCount,
  theme: StyleTheme, scenes: string, research: ResearchReport | null,
  outline?: OutlineItem[]
): Promise<SlideContent[]> {
  console.log(`[AI] Generating ${pageCount} slides, theme=${theme}`);
  console.log(`[AI] Research: ${research?.keyStats.length || 0} stats, ${research?.results[0]?.findings?.length || 0} findings`);

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 30000,
      system: buildSystemPrompt(theme, pageCount, outline),
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
        // C2: Auto-detect source type
        if (s.source) {
          const official = /gartner|idc|mckinsey|bcg|forrester|statista|deloitte|pwc|kpmg|ey|bain|accenture|政府|统计局|财报|annual report|白皮书/i;
          s.sourceType = official.test(s.source) ? 'official' : 'research';
        } else if (s.keyMetrics?.length || s.chartData?.length) {
          s.sourceType = 'inferred';
        }
        correctLayout(s); // auto-fix layout vs content mismatch
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

// ─── Streaming generation: emits each slide as it's parsed ───

function normalizeSlide(s: SlideContent, i: number, total: number): SlideContent {
  s.needsImage = false;
  if (!s.layout) s.layout = 'full-text';
  if (!s.type) {
    if (i === 0) s.type = 'cover';
    else if (i === total - 1) s.type = 'summary';
    else s.type = 'content';
  }
  if (i === 0 && s.type !== 'cover') s.type = 'cover';
  if (s.keyMetrics) s.keyMetrics = s.keyMetrics.filter(m => m.label && m.value);
  if (s.chartData) s.chartData = s.chartData.filter(d => d.label && typeof d.value === 'number');
  if (s.chartType && !['bar', 'pie', 'doughnut', 'line'].includes(s.chartType)) delete s.chartType;
  if (s.tableData && (!s.tableData.headers?.length || !s.tableData.rows?.length)) delete s.tableData;
  // For diagram layout: ensure diagramDescription is populated from bullets if missing
  if (s.layout === 'diagram' && !s.diagramDescription && s.bullets?.length) {
    s.diagramDescription = s.bullets.join('；');
  }
  if (s.source) {
    const official = /gartner|idc|mckinsey|bcg|forrester|statista|deloitte|pwc|kpmg|ey|bain|accenture|政府|统计局|财报|annual report|白皮书/i;
    s.sourceType = official.test(s.source) ? 'official' : 'research';
  } else if (s.keyMetrics?.length || s.chartData?.length) {
    s.sourceType = 'inferred';
  }
  correctLayout(s);
  if ((!s.notes || s.notes.length < 20) && !['cover', 'toc'].includes(s.type)) {
    const parts = [`本页核心：${s.title || ''}`];
    if (s.subtitle) parts.push(s.subtitle);
    if (s.insight) parts.push(`关键洞察：${s.insight}`);
    if (s.source) parts.push(`数据来源：${s.source}`);
    s.notes = parts.join('。');
  }
  return s;
}

export async function generateSlidesStreaming(
  topic: string, description: string, pageCount: PageCount,
  theme: StyleTheme, scenes: string, research: ResearchReport | null,
  onSlide: (slide: SlideContent) => void,
  outline?: OutlineItem[]
): Promise<void> {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 30000,
    system: buildSystemPrompt(theme, pageCount, outline),
    messages: [{ role: 'user', content: buildUserPrompt(topic, description, pageCount, scenes, research) }],
  });

  let buffer = '';
  let emitted = 0;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let objStart = -1;
  let arrayStarted = false;

  stream.on('text', (text) => {
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      buffer += ch;
      const pos = buffer.length - 1;

      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;

      if (!arrayStarted && ch === '[') { arrayStarted = true; continue; }
      if (ch === '{' && depth === 0) { objStart = pos; depth = 1; continue; }
      if (ch === '{') { depth++; continue; }
      if (ch === '}') {
        depth--;
        if (depth === 0 && objStart >= 0) {
          const objStr = buffer.substring(objStart, pos + 1);
          objStart = -1;
          try {
            const slide = JSON.parse(objStr) as SlideContent;
            normalizeSlide(slide, emitted, pageCount);
            onSlide(slide);
            emitted++;
          } catch { /* partial or malformed, skip */ }
        }
      }
    }
  });

  await stream.finalMessage();
}
