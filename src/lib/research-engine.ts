import Anthropic from '@anthropic-ai/sdk';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface ResearchFinding {
  fact: string;
  source: string;
  url?: string;
}

export interface ResearchReport {
  topic: string;
  results: { query: string; findings: ResearchFinding[] }[];
  summary: string;
  keyStats: { metric: string; value: string; source: string }[];
  contentStrategy?: string; // AI-synthesized content strategy for PPTX
}

const client = new Anthropic({
  baseURL: process.env.GAMMER_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.GAMMER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

// ─── Strip proxy noise and extract JSON ───

function extractJSON(text: string): string {
  let s = text
    .replace(/^WARNING:.*$/gm, '')
    .replace(/^Both \.kiro.*$/gm, '')
    .replace(/^Using \.kiro.*$/gm, '')
    .replace(/^Searching.*$/gm, '')
    .replace(/^✓.*$/gm, '')
    .replace(/^- Completed.*$/gm, '')
    .replace(/^Fetching.*$/gm, '')
    .replace(/^Reading.*$/gm, '')
    .replace(/^Here's what I found.*$/gm, '')
    .replace(/^References:.*$/gm, '')
    .replace(/^\[\d+\].*$/gm, '')
    .replace(/```json?\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^json\s*/gm, '') // bare "json" prefix without backticks
    .trim();
  const idx = s.search(/[\[{]/);
  if (idx > 0) s = s.substring(idx);
  return s;
}

export function safeParseJSON(text: string): Record<string, unknown> | null {
  const clean = extractJSON(text);
  if (!clean) return null;
  try { return JSON.parse(clean); } catch { /* continue */ }

  const start = clean.indexOf('{');
  if (start === -1) return null;

  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }

  if (end > start) {
    const candidate = clean.substring(start, end + 1);
    try { return JSON.parse(candidate); } catch { /* continue */ }
    try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')); } catch { /* continue */ }
  }

  const lastEnd = clean.lastIndexOf('}');
  if (lastEnd > start) {
    try { return JSON.parse(clean.substring(start, lastEnd + 1)); } catch { /* continue */ }
  }
  return null;
}

export function safeParseJSONArray(text: string): unknown[] | null {
  const clean = extractJSON(text);
  if (!clean) return null;
  
  // Direct parse
  try { const r = JSON.parse(clean); if (Array.isArray(r)) return r; } catch { /* continue */ }

  // Find the array boundaries with brace matching
  const start = clean.indexOf('[');
  if (start === -1) return null;

  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') { depth--; if (depth === 0 && ch === ']') { end = i; break; } }
    }
  }

  if (end > start) {
    const candidate = clean.substring(start, end + 1);
    try { return JSON.parse(candidate); } catch { /* continue */ }
    try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')); } catch { /* continue */ }
  }

  // Try from start to last ]
  const lastEnd = clean.lastIndexOf(']');
  if (lastEnd > start) {
    try { const r = JSON.parse(clean.substring(start, lastEnd + 1)); if (Array.isArray(r)) return r; } catch { /* continue */ }
  }

  // Last resort: try to auto-close truncated JSON
  if (end === -1 && start >= 0) {
    let attempt = clean.substring(start);
    // Remove trailing incomplete object
    attempt = attempt.replace(/,\s*\{[^}]*$/, '').replace(/,\s*$/, '');
    // Close all open brackets
    const stack: string[] = [];
    let inStr2 = false, esc2 = false;
    for (let i = 0; i < attempt.length; i++) {
      const ch = attempt[i];
      if (esc2) { esc2 = false; continue; }
      if (ch === '\\') { esc2 = true; continue; }
      if (ch === '"') { inStr2 = !inStr2; continue; }
      if (!inStr2) {
        if (ch === '[') stack.push(']');
        else if (ch === '{') stack.push('}');
        else if (ch === ']' || ch === '}') stack.pop();
      }
    }
    if (inStr2) attempt += '"';
    while (stack.length > 0) attempt += stack.pop();
    try { const r = JSON.parse(attempt); if (Array.isArray(r)) return r; } catch { /* continue */ }
  }

  return null;
}

// ─── Extract text from API response ───

function extractAllText(content: Anthropic.Messages.ContentBlock[]): string {
  return content.filter(b => b.type === 'text').map(b => (b as { type: string; text: string }).text).join('\n');
}

// ─── Fetch URL content via Scrapling for enriched research ───

const FETCH_SCRIPT = path.join(process.env.HOME || '~', '.kiro/skills/web-content-fetcher/scripts/fetch.py');
const STEALTH_DOMAINS = ['mp.weixin.qq.com', 'zhuanlan.zhihu.com', 'juejin.cn'];

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const domain = new URL(url).hostname;
    const args = [FETCH_SCRIPT, url, '6000', '--json'];
    if (STEALTH_DOMAINS.some(d => domain.includes(d))) args.splice(3, 0, '--stealth');
    const { stdout } = await execFileAsync('python3', args, { timeout: 30000 });
    const data = JSON.parse(stdout.trim().split('\n').pop() || '{}');
    if (data.content && data.content.length > 100) {
      console.log(`[Research] Fetched ${data.content.length} chars from ${url}`);
      return data.content;
    }
  } catch (e) {
    console.log(`[Research] URL fetch failed: ${(e as Error).message?.substring(0, 80)}`);
  }
  return '';
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s,，)）\]]+/g) || [];
  return [...new Set(matches)].slice(0, 3);
}

// ─── Main research function ───

export async function conductResearch(topic: string, description: string, scenes: string, pageCount?: number): Promise<ResearchReport> {
  console.log(`[Research] Starting for: "${topic}" (${pageCount || 10} pages)`);

  // Phase 0: Extract and fetch URLs from description for enriched context
  const urls = extractUrls(description);
  let urlContext = '';
  if (urls.length > 0) {
    console.log(`[Research] Found ${urls.length} URLs in description, fetching...`);
    const contents = await Promise.all(urls.map(u => fetchUrlContent(u)));
    urlContext = contents.filter(Boolean).join('\n\n---\n\n');
    if (urlContext) console.log(`[Research] URL context: ${urlContext.length} chars`);
  }

  // Phase 1: Deep web search with 20+ queries
  const report = await deepWebSearch(topic, description, scenes, urlContext);

  // Phase 2: If web search failed or insufficient, use knowledge fallback
  if (report.keyStats.length < 8 || report.results[0]?.findings?.length < 15) {
    console.log(`[Research] Insufficient (${report.keyStats.length} stats, ${report.results[0]?.findings?.length || 0} findings), augmenting...`);
    const fallback = await knowledgeFallback(topic, description, scenes);
    if (fallback.keyStats.length > report.keyStats.length) {
      // Merge: keep web search findings, add fallback stats
      report.keyStats = [...report.keyStats, ...fallback.keyStats.filter(fs => !report.keyStats.some(rs => rs.metric === fs.metric))];
      if (report.results[0]?.findings?.length < fallback.results[0]?.findings?.length) {
        report.results = fallback.results;
      }
      if (!report.summary || report.summary.length < fallback.summary.length) {
        report.summary = fallback.summary;
      }
    }
  }

  // Phase 3: Skip separate content strategy — merged into AI generation prompt for speed
  console.log(`[Research] Final: ${report.results[0]?.findings?.length || 0} findings, ${report.keyStats.length} stats`);
  return report;
}

async function deepWebSearch(topic: string, description: string, scenes: string, urlContext: string = ''): Promise<ResearchReport> {
  try {
    const urlSection = urlContext ? `\n\n## 用户提供的参考资料（高优先级，必须引用）\n${urlContext.substring(0, 8000)}` : '';
    // Use streaming to avoid 10-minute timeout with web_search tool
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      tools: [{
        type: 'web_search_20250305' as const,
        name: 'web_search',
        max_uses: 10,
      }],
      messages: [{
        role: 'user',
        content: `你是顶级行业研究分析师。请为"${topic}"进行深度研究。

## 补充信息
描述: ${description || '无'}
场景: ${scenes || '通用'}${urlSection}

## 搜索策略（执行10次高质量搜索）
1. "${topic} 市场规模 2024 亿元"
2. "${topic} 竞争格局 市场份额 TOP5"
3. "${topic} 技术趋势 2025 预测"
4. "${topic} Gartner IDC 报告 2024"
5. "${topic} 投资融资 案例 2024"
6. "${topic} market size 2024 billion forecast"
7. "${topic} market share leaders competitive"
8. "${topic} adoption rate enterprise survey"
9. "${topic} 行业报告 白皮书 数据"
10. "${topic} ROI 成功案例 最佳实践"

完成搜索后，整理为JSON。直接输出JSON，不要代码块，第一个字符必须是 { 。

{"findings":[{"fact":"含具体数字","source":"来源","url":"URL"}],"summary":"300字概述含10+数字","keyStats":[{"metric":"指标","value":"数值","source":"来源"}]}

findings至少15条，keyStats至少10个。`
      }],
    });

    const finalMessage = await stream.finalMessage();

    const text = extractAllText(finalMessage.content);
    console.log(`[Research] Got ${text.length} chars from ${finalMessage.content.length} blocks`);

    if (text.length > 0) {
      const data = safeParseJSON(text);
      if (data && (data.findings || data.keyStats)) {
        const report = buildReport(topic, data);
        console.log(`[Research] ✓ web_search: ${report.results[0].findings.length} findings, ${report.keyStats.length} stats`);
        return report;
      }

      console.log('[Research] JSON parse failed, trying re-structure...');
      return await reStructure(topic, text);
    }
  } catch (e) {
    console.log(`[Research] web_search error: ${(e as Error).message?.substring(0, 150)}`);
  }

  return { topic, results: [{ query: topic, findings: [] }], summary: '', keyStats: [] };
}

// Phase 3: Synthesize a content strategy from research data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function synthesizeContentStrategy(
  topic: string, description: string, scenes: string, pageCount: number, research: ResearchReport
): Promise<string> {
  try {
    const findings = research.results.flatMap(r => r.findings);
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{
        role: 'user',
        content: `你是McKinsey级别的咨询顾问+视觉设计总监。基于研究数据，为严格${pageCount}页的"${topic}"演示文稿设计逐页内容策略。

## 研究概述
${research.summary}

## 关键数据（${research.keyStats.length}个）
${research.keyStats.map(s => `- ${s.metric}: ${s.value} (${s.source})`).join('\n')}

## 详细发现（${findings.length}条）
${findings.slice(0, 25).map(f => `- ${f.fact} (${f.source})`).join('\n')}

## 场景: ${scenes || '通用'}
## 描述: ${description || '无'}

请为每一页（共${pageCount}页）输出具体策略：

### 逐页规划（严格${pageCount}页）
对每页说明：
- 页码 + 建议type + 建议layout
- 标题方向（必须是有观点的结论句，不是"市场概述"）
- 应引用的具体数据（从研究数据中指定）
- 是否需要配图（说明配图主题）
- 是否需要keyMetrics大数字展示（指定哪些数字）
- 是否需要chartData图表（指定数据点）
- 叙事作用（这页在整体故事中扮演什么角色）

### 关键约束
- ${pageCount <= 5 ? '5页极简：每页信息密度极高，每页至少2个keyMetrics或4个bullets' : pageCount <= 10 ? '10页标准：完整论证链，每个论点有数据支撑' : pageCount <= 15 ? '15页详细：多维度分析，每个维度2-3页深入' : '20+页深度：全面覆盖，每个维度充分展开'}
- 所有数据必须来自上面的研究数据，不得编造
- 连续两页不能用相同layout
- 至少${Math.max(3, Math.floor(pageCount / 4))}页需要配图
- 至少${Math.max(2, Math.floor(pageCount / 3))}页需要keyMetrics或chartData`
      }],
    });
    const finalMsg = await stream.finalMessage();
    const strategy = extractAllText(finalMsg.content);
    console.log(`[Research] ✓ Content strategy: ${strategy.length} chars`);
    return strategy;
  } catch (e) {
    console.error('[Research] Strategy synthesis failed:', (e as Error).message);
    return '';
  }
}

async function reStructure(topic: string, rawText: string): Promise<ResearchReport> {
  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10000,
      messages: [{
        role: 'user',
        content: `从以下研究文本中提取结构化数据。只返回JSON，不要代码块，第一个字符必须是 { ：

${rawText.substring(0, 12000)}

格式：{"findings":[{"fact":"事实","source":"来源","url":""}],"summary":"概述","keyStats":[{"metric":"指标","value":"值","source":"来源"}]}
findings至少20条，keyStats至少12个。`
      }],
    });
    const reMsg = await stream.finalMessage();
    const text = extractAllText(reMsg.content);
    const data = safeParseJSON(text);
    if (data && (data.findings || data.keyStats)) {
      const report = buildReport(topic, data);
      console.log(`[Research] ✓ re-structure: ${report.results[0].findings.length} findings`);
      return report;
    }
  } catch (e) {
    console.error('[Research] re-structure failed:', (e as Error).message);
  }
  return { topic, results: [{ query: topic, findings: [] }], summary: '', keyStats: [] };
}

async function knowledgeFallback(topic: string, description: string, scenes: string): Promise<ResearchReport> {
  console.log('[Research] Using knowledge-based fallback...');
  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `你是行业研究分析师。基于专业知识为"${topic}"提供数据报告。
描述: ${description || '无'}  场景: ${scenes || '通用'}

直接返回JSON，第一个字符必须是 { ，不要代码块不要其他文字：
{"findings":[{"fact":"含具体数字","source":"来源机构","url":""}],"summary":"300字概述含10+关键数字","keyStats":[{"metric":"指标","value":"数值含单位","source":"来源"}]}

findings至少15条，keyStats至少10个。覆盖市场规模、增长率、竞争格局、技术趋势、投资动态。`
      }],
    });
    const fbMsg = await stream.finalMessage();
    const text = extractAllText(fbMsg.content);
    const data = safeParseJSON(text);
    if (data && (data.findings || data.keyStats)) {
      const report = buildReport(topic, data);
      console.log(`[Research] ✓ fallback: ${report.results[0].findings.length} findings, ${report.keyStats.length} stats`);
      return report;
    }
  } catch (e) {
    console.error('[Research] fallback failed:', (e as Error).message);
  }
  return { topic, results: [{ query: topic, findings: [] }], summary: '', keyStats: [] };
}

function buildReport(topic: string, data: Record<string, unknown>): ResearchReport {
  return {
    topic,
    results: [{ query: topic, findings: (data.findings || []) as ResearchFinding[] }],
    summary: (data.summary || '') as string,
    keyStats: (data.keyStats || []) as { metric: string; value: string; source: string }[],
  };
}
