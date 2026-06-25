import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/model';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { retryAsync, getErrorMessage } from '@/lib/retry';
import { auth } from '@/lib/auth';

const execFileAsync = promisify(execFile);


const FETCH_SCRIPT = path.join(process.env.HOME || '~', '.kiro/skills/web-content-fetcher/scripts/fetch.py');
const STEALTH_DOMAINS = ['mp.weixin.qq.com', 'zhuanlan.zhihu.com', 'juejin.cn'];

async function fetchWithScrapling(url: string, maxChars = 8000): Promise<string> {
  try {
    const domain = new URL(url).hostname;
    const args = [FETCH_SCRIPT, url, String(maxChars), '--json'];
    if (STEALTH_DOMAINS.some(d => domain.includes(d))) args.splice(3, 0, '--stealth');
    const { stdout } = await execFileAsync('python3', args, { timeout: 30000 });
    const data = JSON.parse(stdout.trim().split('\n').pop() || '{}');
    if (data.content && data.content.length > 50) return data.content;
  } catch (e) {
    console.log(`[FetchURL] Scrapling failed for ${url}: ${(e as Error).message?.substring(0, 100)}`);
  }
  return '';
}

async function fetchFallback(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Gammer/0.1' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return '';
    const html = await res.text();
    return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
  } catch { return ''; }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls, topic } = await req.json() as { urls: string[]; topic?: string };
  const rawTexts: string[] = [];

  for (const url of urls.slice(0, 5)) {
    // Try Scrapling first (preserves markdown structure), fallback to basic fetch
    let text = await fetchWithScrapling(url);
    if (!text) text = await fetchFallback(url);
    if (text.length > 50) rawTexts.push(text);
  }

  if (rawTexts.length === 0) return NextResponse.json({ texts: [], summary: '' });

  // AI analysis: extract structured insights as prompt-ready description
  try {
    const res = await retryAsync(
      async () => anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `分析以下网页内容，提取与"${topic || '演示文稿'}"相关的关键信息，输出结构化的描述文本。

## 网页内容
${rawTexts.join('\n---\n')}

## 输出要求
用中文输出，格式如下（直接输出文本，不要markdown代码块）：
核心主题：一句话概括
关键论点：
- 论点1（附数据/来源）
- 论点2（附数据/来源）
- 论点3（附数据/来源）
关键数据：
- 数据1
- 数据2
可能的结论方向：一句话`
        }],
      }),
      {
        attempts: 3,
        baseDelayMs: 900,
        onRetry: (error, attempt, delayMs) => {
          console.warn(`[FetchURL] summarize retry ${attempt}/3 in ${delayMs}ms: ${getErrorMessage(error).substring(0, 120)}`);
        },
      }
    );
    let summary = '';
    for (const block of res.content) { if (block.type === 'text') summary += block.text; }
    return NextResponse.json({ texts: rawTexts, summary: summary.trim() });
  } catch {
    return NextResponse.json({ texts: rawTexts, summary: '' });
  }
}
