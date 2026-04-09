import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { urls } = await req.json() as { urls: string[] };
  const results: string[] = [];

  for (const url of urls.slice(0, 5)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Gammer/0.1' }, signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const html = await res.text();
      // Extract text: strip tags, collapse whitespace
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
      if (text.length > 50) results.push(text);
    } catch { /* skip failed URLs */ }
  }

  return NextResponse.json({ texts: results });
}
