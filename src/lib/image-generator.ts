import type { SlideContent } from './types';

const API_KEY = process.env.GOOGLE_API_KEY;
const BASE_URL = process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com';
const MODEL = process.env.GOOGLE_MODEL || 'nano-banana-pro';

async function generateImage(prompt: string): Promise<string | null> {
  if (!API_KEY) return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `${BASE_URL}/v1beta/models/${MODEL}:generateContent`;
      console.log(`[Image] Attempt ${attempt + 1}/3: ${prompt.substring(0, 60)}...`);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.log(`[Image] ${res.status}: ${errText.substring(0, 150)}`);
        // 504 or BILLING = don't retry, give up immediately
        if (res.status === 504 || errText.includes('BILLING')) {
          console.log(`[Image] Fatal error (${res.status}), skipping`);
          return null;
        }
        if (res.status === 503 || res.status === 429 || errText.includes('SERVICE_BUSY')) {
          const wait = 3000 * (attempt + 1);
          console.log(`[Image] Busy, retry in ${wait / 1000}s...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            const size = Math.round(part.inlineData.data.length / 1024);
            console.log(`[Image] ✓ Got image (${size}KB)`);
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
      console.log(`[Image] No image in response`);
    } catch (e) {
      console.error(`[Image] Error:`, (e as Error).message);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
  }
  return null;
}

async function tryOpenAIEndpoint(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, prompt, n: 1, size: '1792x1024', response_format: 'b64_json' }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
      if (data?.data?.[0]?.url) return data.data[0].url;
    }
  } catch { /* ignore */ }
  return null;
}

function buildImagePrompt(slide: SlideContent): string {
  // If AI already provided a high-quality prompt (30+ words), use it with safety suffix
  if (slide.imagePrompt && slide.imagePrompt.split(' ').length >= 25) {
    return `${slide.imagePrompt}. CRITICAL: NO text, words, letters, numbers, labels, or watermarks anywhere in the image. Pure visual illustration only. 16:9 wide format, professional quality, 4K resolution.`;
  }

  // Build a rich prompt from slide content
  const context = [slide.title, slide.subtitle].filter(Boolean).join('. ');
  const bulletContext = (slide.bullets || []).slice(0, 2).join('. ');

  const typePrompts: Record<string, string> = {
    cover: `Stunning hero image for a professional presentation about: ${context}. Wide cinematic composition, dramatic lighting, abstract conceptual visualization that captures the essence of the topic. Modern corporate aesthetic with depth and dimension, subtle gradient background.`,
    content: `Professional business illustration supporting the concept: ${context}. ${bulletContext}. Clean modern corporate style, conceptual visualization, flat design with subtle 3D depth, muted professional palette with one accent color.`,
    data: `Abstract data visualization artwork representing: ${context}. Flowing data streams, analytical dashboard elements, modern infographic aesthetic with glowing nodes and connections. Dark background with bright data points.`,
    comparison: `Split composition illustration showing contrast and comparison for: ${context}. Two distinct visual zones representing different approaches, connected by a central dividing element. Professional analytical style.`,
    timeline: `Abstract progression and journey visualization for: ${context}. Sequential flow with milestones, forward momentum, evolving stages from left to right. Modern roadmap aesthetic with depth.`,
    architecture: `Technical system architecture visualization for: ${context}. Interconnected components, cloud-native aesthetic, layered infrastructure diagram as art. Isometric 3D style with clean lines.`,
    summary: `Forward-looking optimistic visualization for: ${context}. Bright, achievement-oriented, convergence of elements into a unified vision. Upward trajectory, success metaphor.`,
    action: `Dynamic call-to-action visualization for: ${context}. Energetic forward momentum, launch metaphor, bright optimistic colors against professional backdrop.`,
  };

  const base = typePrompts[slide.type] || typePrompts.content;
  return `${base} 16:9 wide format, minimalist composition, professional quality. CRITICAL: NO text, words, letters, numbers, labels, or watermarks anywhere in the image.`;
}

export async function generateSlideImages(slides: SlideContent[]): Promise<SlideContent[]> {
  const needImages = slides.filter(s => s.needsImage);
  if (needImages.length === 0 || !API_KEY) {
    if (!API_KEY) console.log('[Images] No GOOGLE_API_KEY, skipping');
    return slides;
  }

  // Allow up to 4 images per deck
  const maxImages = Math.min(needImages.length, 4);
  console.log(`[Images] Generating up to ${maxImages} images...`);

  let generated = 0;
  for (const slide of needImages.slice(0, maxImages)) {
    console.log(`[Images] ${generated + 1}/${maxImages}: ${slide.type} - ${slide.title.substring(0, 30)}`);
    const url = await generateImage(buildImagePrompt(slide));
    if (url) {
      slide.imageUrl = url;
      generated++;
    } else {
      slide.needsImage = false;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  needImages.slice(maxImages).forEach(s => { s.needsImage = false; });

  console.log(`[Images] ✓ ${generated}/${needImages.length} images generated`);
  return slides;
}
