import Anthropic from '@anthropic-ai/sdk';
import type { PageCount, StyleTheme, SlideContent } from './types';
import type { ResearchReport } from './research-engine';
import { safeParseJSONArray } from './research-engine';

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
  return `你是同时精通McKinsey/BCG/Bain方法论的顶级咨询顾问+视觉设计总监。你的目标是生成超越Gamma.app质量的专业演示文稿。

你对每一页PPT拥有**完全的创意控制权**——页面类型、布局方式、是否配图、内容深度、数据展示方式全由你决定。

## 核心方法论
1. **金字塔原理**：结论先行→论据支撑→数据佐证
2. **MECE原则**：互不重叠、完全穷尽
3. **So What测试**：每页标题必须是有观点的结论句（如"云计算市场突破万亿，三朵云格局已定"而非"市场概述"）
4. **数据说话**：每个论点必须有研究报告的真实数据支撑，严禁编造
5. **叙事节奏**：页面之间逻辑递进，类型和布局要有变化，避免单调重复
6. **视觉策略**：配图必须与内容深度关联，不是装饰而是信息传达的一部分

## 当前风格
${STYLE_GUIDES[theme] || STYLE_GUIDES.google}

## 页数结构
${getStructureGuide(pageCount)}

## 设计工具箱

### 页面类型（type）
cover / toc / content / data / comparison / timeline / architecture / summary / action / appendix

### 布局（layout）
- **full-text**：纯文字论述（5-7条bullets）
- **text-left-image-right**：左文右图（概念解释+视觉辅助）
- **image-left-text-right**：左图右文
- **metrics-grid**：大数字卡片网格（2-4个keyMetrics，必须有keyMetrics字段）
- **chart-focus**：图表为主（chartData必填，3-8个数据点）
- **two-column**：双栏对比/并列
- **three-column**：三栏并列（3个方案/阶段/维度）
- **big-number**：一个超大数字+解读（keyMetrics只放1个）
- **quote-highlight**：引用/金句高亮（insight字段作为主引用）

### 配图（已禁用）
所有页面 needsImage 设为 false，imagePrompt 留空。视觉效果通过 PPTX 渲染引擎的形状、色块、图表实现。

### 内容字段规范
- **title**：不超过25字，必须是有观点的结论句
- **subtitle**：本页的"So What"一句话总结
- **bullets**：每条50-100字，必须有实质内容和数据引用
- **keyMetrics**：大数字卡片。metrics-grid布局2-4个，big-number布局1个。每个必须有label/value/unit/trend
- **chartData**：chart-focus布局必填，3-8个数据点(label+value)，value必须是数字
- **insight**：本页最核心的一句话洞察
- **source**：数据来源标注
- **notes**：演讲者备注（80-150字），每页必须有，描述本页要传达的核心信息和讲解要点
- **designNotes**：给渲染引擎的提示

## 关键约束
- 页数严格 ${pageCount} 页，不多不少
- 所有数据必须来自提供的研究报告，不得编造
- 连续两页不能用相同的layout
- 至少使用5种不同layout
- 最后一页type必须是summary或action
- 每页必须有notes字段（演讲者备注）
- 每3-4页至少有一个视觉变化（图表/大数字/引用高亮）
- needsImage始终为false

## 自我优化检查清单（生成后自检）
1. 每页标题是否都是有观点的结论句？（不是"市场概述"而是"市场突破万亿"）
2. 每页是否都有至少一个数据点支撑？
3. 布局是否足够多样？（至少5种不同layout）
4. 配图页的imagePrompt是否足够具体？— 已禁用，跳过
5. 叙事是否有逻辑递进？（问题→分析→方案→验证→行动）
6. keyMetrics的数字是否来自研究数据？
7. chartData的value是否都是数字类型？`;
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
      researchSection += `

### 内容策略（由研究分析师制定，请严格遵循）
${research.contentStrategy}`;
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
2. 不要markdown代码块，不要任何其他文字，只返回纯JSON数组
3. 第一个字符必须是 [
4. 使用紧凑JSON格式（不要换行和缩进），减少token消耗
5. 每个元素完整包含所有字段：type, layout, title, subtitle, bullets, keyMetrics, chartData, insight, source, notes, needsImage, imagePrompt, designNotes
6. null字段可以省略，空数组用[]`;
}

export async function generateWithAI(
  topic: string, description: string, pageCount: PageCount,
  theme: StyleTheme, scenes: string, research: ResearchReport | null
): Promise<SlideContent[]> {
  console.log(`[AI] Generating ${pageCount} slides, theme=${theme}`);
  console.log(`[AI] Research: ${research?.keyStats.length || 0} stats, ${research?.results[0]?.findings?.length || 0} findings`);
  if (research?.contentStrategy) console.log(`[AI] Content strategy: ${research.contentStrategy.length} chars`);

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
      slides.forEach(s => {
        s.needsImage = false;
        if (!s.layout) s.layout = 'full-text';
        if (!s.type) s.type = 'content';
        if (s.keyMetrics) s.keyMetrics = s.keyMetrics.filter(m => m.label && m.value);
        if (s.chartData) s.chartData = s.chartData.filter(d => d.label && typeof d.value === 'number');
        // Auto-fill missing notes
        if (!s.notes && !['cover', 'toc'].includes(s.type)) {
          s.notes = `本页核心：${s.title || ''}。${s.subtitle || s.insight || ''}`;
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
