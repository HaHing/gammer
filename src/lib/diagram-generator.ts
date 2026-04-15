import type { SlideContent, DiagramStyle, ThemeConfig } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// 7 design styles with color palettes and visual characteristics
const STYLE_CONFIGS: Record<DiagramStyle, { colors: string[]; bg: string; stroke: string; font: string; radius: number; shadow: boolean; description: string }> = {
  blueprint: {
    colors: ['#1E3A5F', '#2E86AB', '#A23B72', '#F18F01', '#C73E1D'],
    bg: '#0A1628', stroke: '#2E86AB', font: '#E8F1F8', radius: 4, shadow: false,
    description: 'Dark blueprint style with technical grid lines and cyan accents',
  },
  minimal: {
    colors: ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#74B9FF'],
    bg: '#FFFFFF', stroke: '#B2BEC3', font: '#2D3436', radius: 8, shadow: false,
    description: 'Clean white background with thin gray lines and subtle colors',
  },
  corporate: {
    colors: ['#2C3E50', '#3498DB', '#E74C3C', '#27AE60', '#F39C12'],
    bg: '#F8F9FA', stroke: '#BDC3C7', font: '#2C3E50', radius: 6, shadow: true,
    description: 'Professional with drop shadows, rounded corners, and business colors',
  },
  neon: {
    colors: ['#00F5FF', '#FF006E', '#8338EC', '#FFBE0B', '#3A86FF'],
    bg: '#0D1117', stroke: '#30363D', font: '#E6EDF3', radius: 12, shadow: false,
    description: 'Dark background with glowing neon-colored elements and borders',
  },
  'hand-drawn': {
    colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
    bg: '#FDF6EC', stroke: '#264653', font: '#264653', radius: 2, shadow: false,
    description: 'Warm paper background with slightly rough edges and earthy tones',
  },
  gradient: {
    colors: ['#667EEA', '#764BA2', '#F093FB', '#4FACFE', '#43E97B'],
    bg: '#FFFFFF', stroke: '#E2E8F0', font: '#1A202C', radius: 16, shadow: true,
    description: 'Modern gradient fills on nodes with smooth rounded shapes',
  },
  monochrome: {
    colors: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560'],
    bg: '#FAFAFA', stroke: '#333333', font: '#1A1A2E', radius: 0, shadow: false,
    description: 'Black and white with one accent color, sharp geometric shapes',
  },
};

function buildSvgPrompt(description: string, style: DiagramStyle, theme: ThemeConfig): string {
  const cfg = STYLE_CONFIGS[style];
  return `Generate a clean SVG diagram based on this description:
"${description}"

Style: ${cfg.description}
Colors: ${cfg.colors.join(', ')}
Background: ${cfg.bg}
Stroke: ${cfg.stroke}
Text color: ${cfg.font}
Border radius: ${cfg.radius}px
Theme accent: ${theme.primary}

Requirements:
- Output ONLY valid SVG code, starting with <svg and ending with </svg>
- ViewBox: 0 0 800 450 (16:9 aspect ratio)
- Use the specified color palette
- Include clear labels on all elements
- Use arrows (→) for flow/connections with proper SVG markers
- Font: sans-serif, readable sizes (12-16px for labels, 10-12px for details)
- No external dependencies or images
- Keep it professional and clean
- Maximum 20 nodes/elements to avoid clutter
- For flowcharts: use rectangles with rounded corners for processes, diamonds for decisions, rounded rectangles for start/end
- For architecture: use layered boxes with clear boundaries
- For mind maps: use a central node with radiating branches
- For org charts: use hierarchical tree layout
- For sequence diagrams: use vertical lifelines with horizontal arrows
- For network diagrams: use circles/icons for nodes with labeled connections`;
}

async function callAI(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'You are an SVG diagram generator. Output ONLY valid SVG code. No markdown, no explanation, no code blocks. Start with <svg, end with </svg>.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    if (!res.ok) {
      console.log(`[DiagramGen] API error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    let svg = data.choices?.[0]?.message?.content?.trim() || '';
    // Extract SVG if wrapped in code blocks
    const match = svg.match(/<svg[\s\S]*<\/svg>/);
    if (match) svg = match[0];
    if (!svg.startsWith('<svg')) return null;
    return svg;
  } catch (e) {
    console.log(`[DiagramGen] Error: ${(e as Error).message}`);
    return null;
  }
}

// Auto-detect best diagram style based on theme
function pickStyle(theme: ThemeConfig, requested?: DiagramStyle): DiagramStyle {
  if (requested) return requested;
  // Match diagram style to presentation theme
  const bg = theme.background.toLowerCase();
  if (bg.includes('0') || bg.includes('1a') || bg.includes('dark')) return 'blueprint';
  return 'corporate';
}

export async function generateDiagrams(
  slides: SlideContent[],
  theme: ThemeConfig,
  onProgress?: (index: number, total: number) => void
): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.log('[DiagramGen] No OPENAI_API_KEY, skipping diagram generation');
    return;
  }

  const candidates = slides
    .map((s, i) => ({ slide: s, index: i }))
    .filter(({ slide }) => slide.layout === 'diagram' && slide.diagramDescription && !slide.diagramSvg);

  if (candidates.length === 0) return;
  console.log(`[DiagramGen] Generating ${candidates.length} diagrams...`);

  for (let i = 0; i < candidates.length; i++) {
    const { slide } = candidates[i];
    const style = pickStyle(theme, slide.diagramStyle);
    const prompt = buildSvgPrompt(slide.diagramDescription!, style, theme);
    const svg = await callAI(prompt);
    if (svg) slide.diagramSvg = svg;
    onProgress?.(i + 1, candidates.length);
  }

  const generated = candidates.filter(c => c.slide.diagramSvg).length;
  console.log(`[DiagramGen] Done: ${generated}/${candidates.length} diagrams generated`);
}

// Generate a standalone SVG from natural language (for manual use)
export async function generateSvgFromText(
  description: string,
  style: DiagramStyle = 'corporate',
  theme?: ThemeConfig
): Promise<string | null> {
  const defaultTheme: ThemeConfig = theme || { name: 'default', primary: '#3498DB', secondary: '#7F8C8D', accent: '#E74C3C', background: '#FFFFFF', text: '#2C3E50', lightGray: '#ECF0F1', description: '' };
  const prompt = buildSvgPrompt(description, style, defaultTheme);
  return callAI(prompt);
}

export { STYLE_CONFIGS };
