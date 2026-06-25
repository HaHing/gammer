import { anthropic, MODEL } from './model';
import type { PageCount, StyleTheme, SlideContent, SlideLayout, OutlineItem } from './types';
import type { ResearchReport } from './research-engine';
import { safeParseJSONArray } from './research-engine';
import { themeDesigns } from './theme-design';
import { retryAsync, getErrorMessage, isRetryableError } from './retry';


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
    5: `5页精简：P1封面 → P2核心问题(big-number/metrics-grid震撼开场) → P3解决方案(chart-focus/two-column) → P4数据验证(metrics-grid/chart-focus) → P5结论行动(summary)。每页信息密度极高，至少4个bullets或2个keyMetrics。`,
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

### diagram 布局 — Mermaid 流程图语法

⚠️ 重要：当内容涉及以下任何场景时，必须使用 diagram layout 而不是 full-text：
- 系统架构（如 Agent架构、微服务架构、技术栈）
- 业务流程（如用户注册流程、审批流程、数据处理管线）
- 组织架构、层级关系
- 网络拓扑、数据流向
- 决策树、状态机
- 任何包含"→"箭头、层级关系、节点连接的内容

当 layout 为 "diagram" 时，必须提供 mermaidCode 字段（有效 Mermaid flowchart 语法）：

生成规则：
1. 层级/架构用 "graph TD"（自上而下），顺序流程用 "graph LR"（从左到右）
2. 控制在 4-12 个节点（幻灯片可读性最佳范围），绝不超过15个
3. 节点标签简洁：2-8个中文字 或 2-5个英文单词，不超过15字符
4. 使用语义化形状：
   - [文本] 流程步骤/处理（矩形）
   - {文本} 判断/决策点（菱形）— 必须有2+条输出边
   - ([文本]) 输入/输出（圆角矩形）
   - ((文本)) 开始/结束（圆形）
   - [(文本)] 数据库/存储（圆柱形）
5. 分支路径必须用 |标签| 标注：B -->|是| C 和 B -->|否| D
6. 多目标可用 & 语法：A --> B & C（A同时连接B和C）
7. 8+个节点时用 subgraph 分组，每组3-5个节点
8. 禁止 classDef/style/click 指令（样式由渲染引擎控制）
9. 节点ID用简单字母数字（A, B, C1, apiGw 等），不用中文做ID
10. 节点标签中不要使用括号()、引号""、竖线|等特殊字符

### 方向选择指南
- graph TD：适合层级架构、决策树、数据流向下（自上而下）
- graph LR：适合业务流程、审批流程、管道处理（从左到右）
- 如果图很宽（并行分支多），用 TD
- 如果图很长（串行步骤多），用 LR

### 图表设计原则
- 每个判断节点{菱形}必须有≥2条标注的输出边
- 起始/终止用 ((圆)) 或 ([圆角])，中间用 [矩形]
- 关键路径用实线 -->，辅助路径用虚线 -.->
- 数据库/存储用 [(圆柱)] 明确标识
- 避免单线串联超过6个节点，适当分支或分组

示例1（决策流程图）：
graph TD
  A([用户请求]) --> B{认证检查}
  B -->|通过| C[API网关]
  B -->|失败| D([返回401])
  C --> E{权限校验}
  E -->|有权限| F[业务服务]
  E -->|无权限| G([返回403])
  F --> H[(数据库)]
  H --> I([返回结果])

示例2（带分组的架构图）：
graph LR
  subgraph 前端 [前端层]
    A[Web应用] --> B[API客户端]
  end
  subgraph 后端 [服务层]
    C[网关] --> D[用户服务]
    C --> E[订单服务]
  end
  B --> C
  D --> F[(用户DB)]
  E --> G[(订单DB)]

示例3（并行分支）：
graph TD
  A([开始]) --> B{类型判断}
  B -->|类型A| C[处理A] & D[记录日志]
  B -->|类型B| E[处理B]
  C --> F([完成])
  D --> F
  E --> F

### ⚠️ 禁止以下写法（会导致解析失败）
- 节点标签含括号：A[处理(核心)] ❌ → A[核心处理] ✅
- 节点标签含竖线：A[A|B选择] ❌ → A[AB选择] ✅
- 中文做节点ID：用户[用户名] ❌ → A[用户名] ✅
- 缺少graph声明头：直接写 A --> B ❌ → graph TD\n  A --> B ✅

同时提供 diagramDescription 一句话摘要作为辅助说明。
bullets 中放补充说明（不超过3条），不要把架构描述放在 bullets 里。
每个演示文稿至少1-2页 diagram，展示核心架构或关键流程。

❌ 错误做法：把架构描述写成一大段文字放在 full-text 的 bullets 里
✅ 正确做法：用 diagram layout + mermaidCode 描述结构，bullets 放简短补充

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
- diagramDescription：当layout为diagram时提供一句话摘要
- mermaidCode：当layout为diagram时必填，有效Mermaid flowchart语法（graph TD/LR + 节点 + 边）

## 约束
- 严格${pageCount}页，最后一页必须是summary/action
- 连续两页不能相同layout，至少5种不同layout
- 所有数据来自研究报告，不得编造
- 每页内容必须饱满：bullets≥4条 或 keyMetrics≥3个 或 tableData≥4行
- ❌ 禁止：把架构/流程/关系描述写成一大段文字放在 full-text 里。必须用 diagram layout
- ❌ 禁止：所有 bullet 都是长段落。每条 bullet 应该是"关键词：简短说明"格式，80-150字
- ✅ 要求：每条 bullet 用"标签：内容"格式，如"市场规模：2024年全球AI市场达$1840亿，同比增长35%"
- ✅ 要求：至少1-2页使用 diagram layout 展示核心架构或关键流程`;
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

// ─── Detect if content describes an architecture/flow/diagram ───
function looksLikeDiagram(s: SlideContent): boolean {
  const text = [s.title, s.subtitle, ...(s.bullets || [])].join(' ');
  const diagramPatterns = /架构|architecture|流程|pipeline|拓扑|topology|→|->|分发|聚合|调度|orchestrat|agent.*sub-?agent|微服务|microservice|层.*层|layer|网关|gateway|数据流|dataflow|状态机|state machine|决策树|decision tree|节点.*连接|工作流|workflow/i;
  const arrowCount = (text.match(/→|->|➜|⟶|──>/g) || []).length;
  return diagramPatterns.test(text) || arrowCount >= 2;
}

// ─── Layout auto-correction: match layout to actual content ───
function correctLayout(s: SlideContent): void {
  if (['cover', 'toc'].includes(s.type)) return;
  const bulletCount = s.bullets?.length || 0;
  const hasMetrics = (s.keyMetrics?.length || 0) > 0;
  const hasChart = (s.chartData?.length || 0) > 0;
  const hasTable = !!s.tableData?.headers?.length;

  // Auto-upgrade to diagram if content describes architecture/flow
  if (s.layout === 'full-text' && !hasChart && !hasTable && looksLikeDiagram(s)) {
    s.layout = 'diagram';
    if (!s.diagramDescription) {
      // Extract structured description from bullets
      const allText = (s.bullets || []).join('；');
      s.diagramDescription = `${s.title}：${allText}`;
    }
    // Keep max 3 short bullets as supplementary text
    if (s.bullets && s.bullets.length > 3) {
      s.bullets = s.bullets.slice(0, 3).map(b => b.length > 60 ? b.slice(0, 57) + '...' : b);
    }
  }

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
    if (hasChart && hasMetrics && bulletCount > 3) {
      s.layout = 'chart-focus';
    } else if (bulletCount > 6 && !hasChart && !hasTable) {
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
    let rawText = '';
    let stopReason = 'unknown';
    try {
      const res = await retryAsync(
        async () => {
          return anthropic.messages.create({
            model: MODEL,
            max_tokens: 30000,
            system: buildSystemPrompt(theme, pageCount, outline),
            messages: [{ role: 'user', content: buildUserPrompt(topic, description, pageCount, scenes, research) }],
          });
        },
        {
          attempts: 3,
          baseDelayMs: 900,
          onRetry: (error, retryAttempt, delayMs) => {
            console.log(`[AI] API retry ${retryAttempt}/3 in ${delayMs}ms: ${getErrorMessage(error).substring(0, 120)}`);
          },
        }
      );
      stopReason = String(res.stop_reason ?? 'unknown');
      for (const block of res.content) {
        if (block.type === 'text') rawText += block.text;
      }
    } catch (e) {
      console.error(`[AI] Attempt ${attempt + 1} request failed: ${getErrorMessage(e).substring(0, 200)}`);
      if (attempt === 0) {
        console.log('[AI] Retrying full generation...');
        continue;
      }
      throw e;
    }
    console.log(`[AI] Attempt ${attempt + 1}: ${rawText.length} chars, stop=${stopReason}`);
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

      // Visual rhythm enforcement: break up 3+ consecutive text-heavy layouts
      const textHeavy = new Set(['full-text', 'two-column', 'three-column']);
      const visualUpgrades: SlideLayout[] = ['metrics-grid', 'icon-grid', 'process-flow', 'diagram'];
      for (let i = 2; i < slides.length; i++) {
        if (['cover', 'toc'].includes(slides[i].type)) continue;
        if (textHeavy.has(slides[i].layout) && textHeavy.has(slides[i-1].layout) && textHeavy.has(slides[i-2].layout)) {
          const s = slides[i];
          const bulletCount = s.bullets?.length || 0;
          const hasMetrics = (s.keyMetrics?.length || 0) > 0;
          // Pick best visual upgrade based on content
          if (hasMetrics) { s.layout = 'metrics-grid'; }
          else if (bulletCount >= 3 && bulletCount <= 6) { s.layout = visualUpgrades[Math.floor(Math.random() * 2) + 1]; } // icon-grid or process-flow
          else if (looksLikeDiagram(s)) { s.layout = 'diagram'; if (!s.diagramDescription && s.bullets?.length) s.diagramDescription = s.bullets.join('→'); }
          else if (bulletCount >= 4) { s.layout = 'icon-grid'; }
        }
      }

      // Ensure last slide is summary/action
      const last = slides[slides.length - 1];
      if (last && !['summary', 'action'].includes(last.type)) {
        last.type = 'summary';
      }

      const layouts = [...new Set(slides.map(s => s.layout))];
      console.log(`[AI] ✓ ${slides.length} slides, ${layouts.length} layouts: ${layouts.join(', ')}`);
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
  // For diagram layout: validate mermaidCode, fallback to diagramDescription
  if (s.layout === 'diagram') {
    if (s.mermaidCode) {
      // Validate: must have at least "graph" and "-->" or "---"
      const hasMermaidStructure = /^(?:graph|flowchart)\s+/im.test(s.mermaidCode) && /-->|---/.test(s.mermaidCode);
      if (!hasMermaidStructure) {
        // Invalid mermaid, convert to diagramDescription fallback
        if (!s.diagramDescription) s.diagramDescription = s.mermaidCode.replace(/^(?:graph|flowchart)\s+\w+\s*/im, '').replace(/\n/g, '→');
        delete s.mermaidCode;
      }
    }
    if (!s.mermaidCode && !s.diagramDescription && s.bullets?.length) {
      s.diagramDescription = s.bullets.join('；');
    }
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
  const emittedSlides: SlideContent[] = [];

  const emitSlide = (slide: SlideContent) => {
    const idx = emittedSlides.length;
    normalizeSlide(slide, idx, pageCount);
    emittedSlides.push(slide);
    onSlide(slide);
  };

  const streamOnce = async (): Promise<void> => {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 30000,
      system: buildSystemPrompt(theme, pageCount, outline),
      messages: [{ role: 'user', content: buildUserPrompt(topic, description, pageCount, scenes, research) }],
    });

    let buffer = '';
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
              emitSlide(slide);
            } catch {
              // partial or malformed, skip
            }
          }
        }
      }
    });

    await stream.finalMessage();
  };

  try {
    await retryAsync(
      async () => streamOnce(),
      {
        attempts: 2,
        baseDelayMs: 1100,
        shouldRetry: (error) => emittedSlides.length === 0 && isRetryableError(error),
        onRetry: (error, attempt, delayMs) => {
          console.warn(`[AI] stream retry ${attempt}/2 in ${delayMs}ms: ${getErrorMessage(error).substring(0, 140)}`);
        },
      }
    );
  } catch (streamError) {
    console.warn(`[AI] stream failed, fallback to non-stream generation: ${getErrorMessage(streamError).substring(0, 180)}`);
  }

  if (emittedSlides.length < pageCount) {
    console.log(`[AI] stream emitted ${emittedSlides.length}/${pageCount}, backfilling with non-stream response`);
    const fullSlides = await generateWithAI(topic, description, pageCount, theme, scenes, research, outline);
    for (let i = emittedSlides.length; i < Math.min(pageCount, fullSlides.length); i++) {
      emitSlide({ ...fullSlides[i] });
    }
  }

  while (emittedSlides.length < pageCount) {
    emitSlide({ type: 'content', layout: 'full-text', title: `补充内容 ${emittedSlides.length + 1}`, bullets: ['待补充'], needsImage: false });
  }
}
