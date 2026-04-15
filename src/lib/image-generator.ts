import type { SlideContent } from './types';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_BASE_URL = process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com';
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp';

function buildImagePrompt(slide: SlideContent): string {
  const parts = [`Professional presentation slide illustration for: "${slide.title}"`];
  if (slide.subtitle) parts.push(slide.subtitle);
  if (slide.insight) parts.push(`Key insight: ${slide.insight}`);
  parts.push('Style: clean, modern, corporate, flat design, no text, suitable for business presentation background. 16:9 aspect ratio.');
  return parts.join('. ');
}

async function generateOneImage(prompt: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `${GOOGLE_BASE_URL}/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    if (!res.ok) {
      console.log(`[ImageGen] API error: ${res.status} ${await res.text().then(t => t.substring(0, 200))}`);
      return null;
    }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.log(`[ImageGen] Error: ${(e as Error).message}`);
    return null;
  }
}

export async function generateImages(
  slides: SlideContent[],
  onProgress?: (index: number, total: number) => void
): Promise<void> {
  if (!GOOGLE_API_KEY) {
    console.log('[ImageGen] No GOOGLE_API_KEY, skipping image generation');
    return;
  }

  // Select slides that benefit from images (skip cover, toc, data-heavy slides)
  const candidates = slides
    .map((s, i) => ({ slide: s, index: i }))
    .filter(({ slide }) => {
      if (['toc'].includes(slide.type)) return false;
      if (slide.chartData?.length || slide.tableData?.headers?.length) return false;
      return true;
    })
    .slice(0, 8); // max 8 images

  console.log(`[ImageGen] Generating ${candidates.length} images...`);

  // Process in batches of 2 to avoid rate limiting
  for (let i = 0; i < candidates.length; i += 2) {
    const batch = candidates.slice(i, i + 2);
    const results = await Promise.all(
      batch.map(async ({ slide, index }) => {
        const prompt = buildImagePrompt(slide);
        slide.imagePrompt = prompt;
        const imageUrl = await generateOneImage(prompt);
        onProgress?.(i + batch.indexOf(batch.find(b => b.index === index)!), candidates.length);
        return { index, imageUrl };
      })
    );
    for (const { index, imageUrl } of results) {
      if (imageUrl) slides[index].imageUrl = imageUrl;
    }
  }

  const generated = slides.filter(s => s.imageUrl).length;
  console.log(`[ImageGen] Done: ${generated}/${candidates.length} images generated`);
}
