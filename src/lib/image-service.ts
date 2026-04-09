import type { SlideContent } from './types';

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

interface UnsplashPhoto {
  urls: { regular: string; small: string };
  user: { name: string; links: { html: string } };
}

async function searchPhoto(query: string): Promise<{ url: string; credit: string } | null> {
  if (!UNSPLASH_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.results?.[0] as UnsplashPhoto | undefined;
    if (!photo) return null;
    return { url: photo.urls.regular, credit: `Photo by ${photo.user.name} on Unsplash` };
  } catch { return null; }
}

function slideToQuery(slide: SlideContent, topic: string): string {
  // Build a search query from slide content
  const keywords: string[] = [];
  if (slide.title) keywords.push(...slide.title.replace(/[，。、：；！？""''（）【】]/g, ' ').split(/\s+/).slice(0, 3));
  // Add topic context
  keywords.push(...topic.split(/\s+/).slice(0, 2));
  // Map common Chinese tech terms to English for better Unsplash results
  const termMap: Record<string, string> = {
    '云计算': 'cloud computing', '人工智能': 'artificial intelligence', 'AI': 'AI technology',
    '大数据': 'big data', '区块链': 'blockchain', '物联网': 'IoT', '数字化': 'digital transformation',
    '安全': 'cybersecurity', '架构': 'software architecture', '市场': 'business market',
    '增长': 'growth chart', '团队': 'team collaboration', '技术': 'technology', '创新': 'innovation',
    '数据': 'data analytics', '服务器': 'server room', '网络': 'network', '移动': 'mobile app',
  };
  let query = keywords.join(' ');
  for (const [zh, en] of Object.entries(termMap)) {
    if (query.includes(zh)) { query = en; break; }
  }
  return query || 'technology business';
}

// Determine which slides should get images (not all — keep it tasteful)
function shouldHaveImage(slide: SlideContent, index: number, total: number): boolean {
  if (slide.type === 'cover') return true;
  if (slide.type === 'toc') return false;
  // Slides with charts/tables/metrics already have visual content
  if (slide.chartData?.length || slide.tableData?.headers?.length) return false;
  if (slide.keyMetrics && slide.keyMetrics.length >= 3) return false;
  // ~40% of remaining content slides get images
  return index % 3 === 0;
}

export async function enrichWithImages(slides: SlideContent[], topic: string): Promise<SlideContent[]> {
  if (!UNSPLASH_KEY) {
    console.log('[Images] No UNSPLASH_ACCESS_KEY, skipping image enrichment');
    return slides;
  }

  const tasks = slides.map(async (slide, i) => {
    if (!shouldHaveImage(slide, i, slides.length)) return;
    const query = slideToQuery(slide, topic);
    const result = await searchPhoto(query);
    if (result) {
      slide.imageUrl = result.url;
      slide.imageCredit = result.credit;
    }
  });

  await Promise.all(tasks);
  const count = slides.filter(s => s.imageUrl).length;
  console.log(`[Images] Enriched ${count}/${slides.length} slides with Unsplash images`);
  return slides;
}
