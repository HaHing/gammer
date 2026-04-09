import PptxGenJS from 'pptxgenjs';
import type { SlideContent, StyleTheme, ThemeConfig } from './types';
import { themes } from './themes';
import { themeDesigns, ThemeDesign } from './theme-design';

// LAYOUT_WIDE = 13.33" x 7.5"
const W = 13.33;
const PAD = 0.7;       // left/right padding
const CW = W - PAD * 2; // content width = 11.93"

function c(hex: string): string {
  const s = hex.replace('#', '');
  return s.length > 6 ? s.substring(0, 6) : s; // pptxgenjs only accepts 6-digit hex
}

function addFooter(slide: PptxGenJS.Slide, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  if (design.footerStyle === 'full-bar') {
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 7.1, w: W, h: 0.4, fill: { color: c(theme.lightGray) } });
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 7.1, w: W, h: 0.04, fill: { color: c(theme.primary) } });
  } else {
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 7.2, w: W, h: 0.03, fill: { color: c(theme.primary) } });
  }
  slide.addText(`${pageNum} / ${total}`, { x: W - 1.5, y: 7.2, w: 1.2, h: 0.25, fontSize: 8, color: c(theme.secondary), align: 'right' });
}

// ─── Cover ───
function renderCover(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  switch (design.coverStyle) {
    case 'brand-gradient':
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: c(theme.accent), transparency: 70 } });
      slide.addShape('ellipse' as PptxGenJS.ShapeType, { x: W - 5, y: -2, w: 8, h: 8, fill: { color: c(theme.secondary), transparency: 80 } });
      break;
    case 'haio-dark':
      // Dark cover with right stats panel and blue accent (inspired by openclaw-ppt-v2)
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: '1B1F2A' } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.04, h: 7.5, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: W - 2.3, y: 0, w: 2.3, h: 7.5, fill: { color: '252A37' } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: W - 2.3, y: 3.2, w: 0.04, h: 4.3, fill: { color: c(theme.primary) } });
      break;
    case 'full-bleed':
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 5.5, w: W, h: 2, fill: { color: '000000', transparency: 60 } });
      break;
    case 'split-diagonal':
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: 'FFFFFF' } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W / 2, h: 7.5, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: W / 2 - 0.5, y: 0, w: 1, h: 7.5, fill: { color: c(theme.accent) } });
      break;
    case 'gradient-bottom':
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: 'FFFFFF' } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 5, w: W, h: 2.5, fill: { color: c(theme.primary) } });
      break;
    case 'centered':
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: 'FFFFFF' } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 0.12, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 7.38, w: W, h: 0.12, fill: { color: c(theme.primary) } });
      break;
    default: // left-block
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 7.5, fill: { color: c(theme.primary) } });
      slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0.8, y: 0.8, w: 0.06, h: 3, fill: { color: c(theme.accent) } });
      break;
  }

  const isLight = ['centered', 'gradient-bottom', 'split-diagonal'].includes(design.coverStyle);
  const titleColor = isLight ? c(theme.primary) : 'FFFFFF';
  const subColor = isLight ? c(theme.secondary) : 'D0D0D0';
  const titleX = design.coverStyle === 'split-diagonal' ? 1.0 : design.coverStyle === 'centered' ? 2.0 : design.coverStyle === 'haio-dark' ? 1.0 : 1.2;
  const titleW = design.coverStyle === 'split-diagonal' ? W / 2 - 2 : design.coverStyle === 'centered' ? W - 4 : design.coverStyle === 'haio-dark' ? W - 4 : W - 3;
  const titleY = design.coverStyle === 'centered' ? 2.0 : design.coverStyle === 'haio-dark' ? 2.3 : 1.5;
  const titleAlign = design.coverStyle === 'centered' ? 'center' as const : 'left' as const;

  slide.addText(content.title, {
    x: titleX, y: titleY, w: titleW, h: 2.2,
    fontSize: design.titleSize + 10, color: titleColor, bold: true, fontFace: 'Microsoft YaHei',
    lineSpacingMultiple: 1.2, align: titleAlign,
  });
  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: titleX, y: titleY + 2.4, w: titleW, h: 0.8,
      fontSize: design.bodySize + 2, color: subColor, fontFace: 'Microsoft YaHei', align: titleAlign,
    });
  }
  const dateY = design.coverStyle === 'gradient-bottom' ? 5.5 : 5.8;
  slide.addText(new Date().toLocaleDateString('zh-CN'), {
    x: titleX, y: dateY, w: 3, h: 0.4, fontSize: 11, color: subColor,
  });
  slide.addText('Powered by Gammer', {
    x: W - 4, y: dateY, w: 3, h: 0.4, fontSize: 9, color: subColor, align: 'right', italic: true,
  });

  // Haio-dark: report type label + blue accent line
  if (design.coverStyle === 'haio-dark') {
    slide.addText('PROFESSIONAL REPORT', {
      x: 1.0, y: 1.8, w: 8, h: 0.3, fontSize: 10, fontFace: 'Microsoft YaHei',
      color: '8A8FA0', charSpacing: 4,
    });
    slide.addShape('line' as PptxGenJS.ShapeType, { x: 1.0, y: titleY + 2.1, w: 3.5, h: 0, line: { color: c(theme.primary), width: 2 } });
  }
}

// ─── TOC ───
function renderToc(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, total: number) {
  slide.addText(content.title || '议程', {
    x: PAD, y: 0.3, w: CW, h: 0.7,
    fontSize: design.titleSize, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei',
  });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 1.0, w: 1.5, h: 0.04, fill: { color: c(theme.accent) } });

  const items = content.bullets || [];
  items.forEach((item, i) => {
    const y = 1.3 + i * 0.65;
    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
      x: PAD, y, w: CW, h: 0.55,
      fill: { color: i % 2 === 0 ? c(theme.lightGray) : 'FFFFFF' }, rectRadius: 0.06,
    });
    slide.addShape('ellipse' as PptxGenJS.ShapeType, { x: PAD + 0.2, y: y + 0.09, w: 0.36, h: 0.36, fill: { color: c(theme.primary) } });
    slide.addText(`${i + 1}`, { x: PAD + 0.2, y: y + 0.09, w: 0.36, h: 0.36, fontSize: 11, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
    slide.addText(item, { x: PAD + 0.8, y, w: CW - 1, h: 0.55, fontSize: design.bodySize - 1, color: c(theme.text), fontFace: 'Microsoft YaHei', valign: 'middle' });
  });
  addFooter(slide, theme, design, 2, total);
}

// ─── Shared renderers ───
function renderKeyMetrics(slide: PptxGenJS.Slide, metrics: SlideContent['keyMetrics'], theme: ThemeConfig, design: ThemeDesign, y: number, w: number, x: number = PAD): number {
  if (!metrics || metrics.length === 0) return y;
  const count = Math.min(metrics.length, 4);
  const gap = 0.25;
  const metricW = (w - gap * (count - 1)) / count;

  metrics.slice(0, 4).forEach((m, i) => {
    const mx = x + i * (metricW + gap);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: mx, y, w: metricW, h: 1.35, fill: { color: c(theme.lightGray) }, rectRadius: 0.1 });
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: mx, y, w: metricW, h: 0.06, fill: { color: c(i === 0 ? theme.primary : theme.accent) } });
    if (m.trend) {
      const arrow = m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '●';
      const tColor = m.trend === 'up' ? '34A853' : m.trend === 'down' ? 'EA4335' : c(theme.secondary);
      slide.addText(arrow, { x: mx + metricW - 0.4, y: y + 0.1, w: 0.3, h: 0.25, fontSize: 10, color: tColor, align: 'right' });
    }
    slide.addText(m.value + (m.unit ? ` ${m.unit}` : ''), {
      x: mx + 0.12, y: y + 0.2, w: metricW - 0.24, h: 0.65,
      fontSize: count <= 2 ? 26 : 20, color: c(theme.primary), bold: true, align: 'center', fontFace: 'Microsoft YaHei',
    });
    slide.addText(m.label, {
      x: mx + 0.08, y: y + 0.88, w: metricW - 0.16, h: 0.38,
      fontSize: 9, color: c(theme.secondary), align: 'center', fontFace: 'Microsoft YaHei',
    });
  });
  return y + 1.55;
}

function renderInsight(slide: PptxGenJS.Slide, insight: string, theme: ThemeConfig, y: number, w: number, x: number = PAD, insightStyle?: string): number {
  if (insightStyle === 'banner') {
    // Full-width banner style (Deloitte/Brand)
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x, y, w, h: 0.65, fill: { color: c(theme.primary) }, rectRadius: 0.08 });
    slide.addText(`💡 ${insight}`, { x: x + 0.2, y, w: w - 0.4, h: 0.65, fontSize: 11, color: 'FFFFFF', fontFace: 'Microsoft YaHei', valign: 'middle', bold: true });
    return y + 0.8;
  }
  if (insightStyle === 'box') {
    // Boxed style with background (Microsoft/PwC)
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x, y, w, h: 0.65, fill: { color: c(theme.lightGray) }, rectRadius: 0.08, shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.06 } });
    slide.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: 0.06, h: 0.65, fill: { color: c(theme.accent) } });
    slide.addText(`💡 ${insight}`, { x: x + 0.2, y, w: w - 0.4, h: 0.65, fontSize: 11, color: c(theme.text), fontFace: 'Microsoft YaHei', valign: 'middle', bold: true });
    return y + 0.8;
  }
  // Default: bar style
  slide.addShape('roundRect' as PptxGenJS.ShapeType, { x, y, w, h: 0.6, fill: { color: c(theme.lightGray) }, rectRadius: 0.08 });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: 0.06, h: 0.6, fill: { color: c(theme.primary) } });
  slide.addText(`💡 ${insight}`, { x: x + 0.2, y, w: w - 0.4, h: 0.6, fontSize: 11, color: c(theme.text), fontFace: 'Microsoft YaHei', valign: 'middle', bold: true });
  return y + 0.75;
}

function renderBullets(slide: PptxGenJS.Slide, bullets: string[], theme: ThemeConfig, design: ThemeDesign, y: number, w: number, x: number = PAD): number {
  const bulletChars: Record<string, string> = { circle: '●', square: '■', dash: '—', arrow: '▸', number: '' };
  const char = bulletChars[design.bulletStyle] || '●';
  const charsPerLine = Math.floor((w - 0.35) * 5.5); // ~5.5 chars per inch at bodySize-1
  bullets.forEach((b, i) => {
    const lines = Math.max(1, Math.ceil(b.length / charsPerLine));
    const rowH = Math.max(0.38, lines * 0.22);
    const by = y;
    const prefix = design.bulletStyle === 'number' ? `${i + 1}.` : char;
    slide.addText(prefix, { x, y: by, w: 0.35, h: rowH, fontSize: design.bulletStyle === 'number' ? 11 : 8, color: c(theme.primary), bold: true, align: 'center', valign: 'top' });
    slide.addText(b, { x: x + 0.35, y: by, w: w - 0.35, h: rowH, fontSize: design.bodySize - 1, color: c(theme.text), fontFace: 'Microsoft YaHei', shrinkText: true, valign: 'top' });
    y += rowH + 0.06;
  });
  return y;
}

function renderChart(slide: PptxGenJS.Slide, chartData: SlideContent['chartData'], theme: ThemeConfig, x: number, y: number, w: number, h: number, chartType?: string) {
  if (!chartData || chartData.length === 0) return;

  if (chartType === 'pie' || chartType === 'doughnut') {
    renderPieChart(slide, chartData, theme, x, y, w, h, chartType === 'doughnut');
    return;
  }

  const maxVal = Math.max(...chartData.map(d => d.value));
  const barW = (w - 0.5) / chartData.length;
  const chartBottom = y + h - 0.4;
  const chartH = h - 0.6;

  for (let g = 0; g <= 4; g++) {
    const gy = chartBottom - (g / 4) * chartH;
    slide.addShape('rect' as PptxGenJS.ShapeType, { x, y: gy, w, h: 0.01, fill: { color: 'E5E7EB' } });
    if (maxVal > 0) slide.addText(String(Math.round(maxVal * g / 4)), { x: x - 0.5, y: gy - 0.1, w: 0.45, h: 0.2, fontSize: 7, color: c(theme.secondary), align: 'right' });
  }
  slide.addShape('rect' as PptxGenJS.ShapeType, { x, y: chartBottom, w, h: 0.02, fill: { color: c(theme.secondary) } });

  chartData.forEach((d, i) => {
    const barH = maxVal > 0 ? (d.value / maxVal) * chartH : 0;
    const bx = x + 0.25 + i * barW;
    const bw = barW * 0.6;
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: bx, y: chartBottom - barH, w: bw, h: Math.max(barH, 0.05), fill: { color: c(i % 2 === 0 ? theme.primary : theme.accent) }, rectRadius: 0.04 });
    slide.addText(String(d.value), { x: bx, y: chartBottom - barH - 0.25, w: bw, h: 0.25, fontSize: 9, color: c(theme.primary), align: 'center', bold: true });
    slide.addText(d.label, { x: bx - 0.1, y: chartBottom + 0.05, w: bw + 0.2, h: 0.3, fontSize: 7, color: c(theme.secondary), align: 'center' });
  });
}

function renderPieChart(slide: PptxGenJS.Slide, chartData: SlideContent['chartData'], theme: ThemeConfig, x: number, y: number, w: number, h: number, isDoughnut: boolean) {
  if (!chartData || chartData.length === 0) return;
  const colors = [theme.primary, theme.accent, theme.secondary, '#34A853', '#FBBC04', '#EA4335', '#9AA0A6'].map(c2 => c(c2));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;

  // Use pptxgenjs native chart
  const chartDataFormatted = [{
    name: 'Data',
    labels: chartData.map(d => d.label),
    values: chartData.map(d => d.value),
  }];

  const chartTypeName: 'pie' | 'doughnut' = isDoughnut ? 'doughnut' : 'pie';
  slide.addChart(chartTypeName, chartDataFormatted, {
    x, y, w: w * 0.6, h,
    showLegend: false,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 8,
    dataLabelColor: 'FFFFFF',
    chartColors: colors.slice(0, chartData.length),
  } as PptxGenJS.IChartOpts);

  // Legend on the right
  const legendX = x + w * 0.65;
  chartData.forEach((d, i) => {
    const ly = y + 0.3 + i * 0.35;
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: legendX, y: ly + 0.05, w: 0.15, h: 0.15, fill: { color: colors[i % colors.length] } });
    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
    slide.addText(`${d.label} (${pct}%)`, { x: legendX + 0.22, y: ly, w: w * 0.3, h: 0.25, fontSize: 8, color: c(theme.text) });
  });
}

// ─── Content slide (all layouts) ───
function renderContentSlide(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  const layout = content.layout || 'full-text';

  if (design.accentPosition === 'left-bar') {
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.06, h: 7.5, fill: { color: c(theme.primary) } });
  } else if (design.accentPosition === 'side-stripe') {
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: W - 0.3, y: 0, w: 0.3, h: 7.5, fill: { color: c(theme.primary), transparency: 90 } });
  } else if (design.accentPosition === 'top-line') {
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 0.06, fill: { color: c(theme.primary) } });
  }

  slide.addText(content.title, { x: PAD, y: 0.3, w: CW, h: 0.6, fontSize: design.titleSize - 4, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei' });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 0.88, w: 1.2, h: 0.04, fill: { color: c(theme.accent) } });

  // Haio card container
  if (design.useCard) {
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD - 0.15, y: 1.0, w: CW + 0.3, h: 5.8, fill: { color: 'FFFFFF' }, rectRadius: 0.1, shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.08 } });
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD - 0.15, y: 1.0, w: 0.05, h: 5.8, fill: { color: c(theme.primary) } });
  }

  switch (layout) {
    case 'big-number': renderBigNumber(slide, content, theme, design); break;
    case 'quote-highlight': renderQuoteHighlight(slide, content, theme, design); break;
    case 'two-column': renderTwoColumn(slide, content, theme, design); break;
    case 'three-column': renderThreeColumn(slide, content, theme, design); break;
    case 'metrics-grid': renderMetricsGridLayout(slide, content, theme, design); break;
    case 'chart-focus': renderChartFocusLayout(slide, content, theme, design); break;
    case 'table-focus': renderTableFocusLayout(slide, content, theme, design); break;
    case 'icon-grid': renderIconGridLayout(slide, content, theme, design); break;
    case 'process-flow': renderProcessFlowLayout(slide, content, theme, design); break;
    case 'funnel': renderFunnelLayout(slide, content, theme, design); break;
    default: renderDefaultLayout(slide, content, theme, design); break;
  }
  addFooter(slide, theme, design, pageNum, total);
}

function renderBigNumber(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  const m = content.keyMetrics?.[0];
  if (m) {
    slide.addText(m.value + (m.unit ? ` ${m.unit}` : ''), { x: PAD, y: 1.5, w: CW, h: 2.0, fontSize: 72, color: c(theme.primary), bold: true, align: 'center', fontFace: 'Microsoft YaHei' });
    slide.addText(m.label, { x: 1.5, y: 3.5, w: CW - 1.6, h: 0.6, fontSize: 18, color: c(theme.secondary), align: 'center' });
    if (m.trend) {
      const arrow = m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→';
      const tColor = m.trend === 'up' ? '34A853' : m.trend === 'down' ? 'EA4335' : c(theme.secondary);
      slide.addText(arrow, { x: W / 2 - 0.5, y: 4.1, w: 1, h: 0.5, fontSize: 24, color: tColor, align: 'center', bold: true });
    }
  }
  if (content.insight) renderInsight(slide, content.insight, theme, 4.8, CW - 2, 1.5, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets, theme, design, 5.6, CW - 2, 1.5);
}

function renderQuoteHighlight(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  slide.addText('"', { x: PAD, y: 1.2, w: 1, h: 1.2, fontSize: 80, color: c(theme.primary), bold: true, transparency: 30 });
  const quote = content.insight || content.subtitle || '';
  slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD + 0.3, y: 1.8, w: CW - 0.6, h: 2.2, fill: { color: c(theme.lightGray) }, rectRadius: 0.12 });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD + 0.3, y: 1.8, w: 0.08, h: 2.2, fill: { color: c(theme.primary) } });
  slide.addText(quote, { x: PAD + 0.8, y: 1.9, w: CW - 1.6, h: 2.0, fontSize: 20, color: c(theme.text), fontFace: 'Microsoft YaHei', italic: true, valign: 'middle' });
  if (content.source) slide.addText(`— ${content.source}`, { x: W / 2, y: 4.1, w: CW / 2, h: 0.4, fontSize: 11, color: c(theme.secondary), align: 'right', italic: true });
  if (content.bullets?.length) renderBullets(slide, content.bullets, theme, design, 4.8, CW - 0.6, PAD + 0.3);
}

function renderTwoColumn(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), italic: design.subtitleItalic, fontFace: 'Microsoft YaHei' });
    curY += 0.45;
  }
  if (content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  const bullets = content.bullets || [];
  const mid = Math.ceil(bullets.length / 2);
  const colW = (CW - 0.4) / 2;
  slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD, y: curY, w: colW, h: 0.01, fill: { color: c(theme.primary) }, rectRadius: 0 });
  renderBullets(slide, bullets.slice(0, mid), theme, design, curY + 0.15, colW, PAD);
  slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD + colW + 0.4, y: curY, w: colW, h: 0.01, fill: { color: c(theme.accent) }, rectRadius: 0 });
  renderBullets(slide, bullets.slice(mid), theme, design, curY + 0.15, colW, PAD + colW + 0.4);
  if (content.insight) renderInsight(slide, content.insight, theme, 5.8, CW, PAD, design.insightStyle);
}

function renderThreeColumn(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.45;
  }
  const bullets = content.bullets || [];
  const third = Math.ceil(bullets.length / 3);
  const colW = (CW - 0.6) / 3;
  const gap = 0.3;
  [bullets.slice(0, third), bullets.slice(third, third * 2), bullets.slice(third * 2)].forEach((col, i) => {
    const cx = PAD + i * (colW + gap);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: cx, y: curY, w: colW, h: 0.35, fill: { color: c(theme.primary) }, rectRadius: 0.06 });
    slide.addText(`${i + 1}`, { x: cx, y: curY, w: colW, h: 0.35, fontSize: 11, color: 'FFFFFF', align: 'center', bold: true });
    renderBullets(slide, col, theme, design, curY + 0.5, colW - 0.2, cx + 0.1);
  });
  if (content.insight) renderInsight(slide, content.insight, theme, 5.8, CW, PAD, design.insightStyle);
}

function renderMetricsGridLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.45;
  }
  if (content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets, theme, design, curY, CW);
}

// ─── Table renderer ───
function renderTable(slide: PptxGenJS.Slide, tableData: { headers: string[]; rows: string[][] }, theme: ThemeConfig, design: ThemeDesign, x: number, y: number, w: number): number {
  const rows: PptxGenJS.TableRow[] = [];
  // Header row
  rows.push(tableData.headers.map(h => ({
    text: h, options: { bold: true, color: 'FFFFFF', fill: { color: c(theme.primary) }, fontSize: design.bodySize - 2, fontFace: 'Microsoft YaHei', align: 'center' as const, valign: 'middle' as const },
  })));
  // Data rows with zebra striping
  tableData.rows.forEach((row, i) => {
    rows.push(row.map(cell => ({
      text: cell, options: { fontSize: design.bodySize - 3, color: c(theme.text), fill: { color: i % 2 === 0 ? 'FFFFFF' : c(theme.lightGray) }, fontFace: 'Microsoft YaHei', valign: 'middle' as const },
    })));
  });
  const rowH = 0.38;
  const tableH = rows.length * rowH;
  slide.addTable(rows, { x, y, w, rowH, border: { type: 'solid', pt: 0.5, color: 'E5E7EB' } });
  return y + tableH + 0.2;
}

function renderTableFocusLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.4;
  }
  if (content.tableData?.headers?.length) {
    curY = renderTable(slide, content.tableData, theme, design, PAD, curY, CW);
  }
  if (content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets.slice(0, 3), theme, design, curY, CW);
}

function renderChartFocusLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.4;
  }
  if (content.chartData?.length) { renderChart(slide, content.chartData, theme, 1.5, curY, CW - 1.6, 3.0, content.chartType); curY += 3.2; }
  if (content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets.slice(0, 3), theme, design, curY, CW);
}

function renderDefaultLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), italic: design.subtitleItalic, fontFace: 'Microsoft YaHei' });
    curY += 0.42;
  }
  if (content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (content.bullets?.length) curY = renderBullets(slide, content.bullets, theme, design, curY, CW);
  if (content.chartData?.length) renderChart(slide, content.chartData, theme, PAD, curY, CW, 2.2, content.chartType);
}

// ─── Icon Grid ───
function renderIconGridLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.45;
  }
  const items = content.bullets || [];
  const cols = items.length <= 4 ? 2 : 3;
  const rows = Math.ceil(items.length / cols);
  const cellW = (CW - 0.3 * (cols - 1)) / cols;
  const cellH = Math.min(1.6, (5.5 - curY) / rows);
  items.forEach((item, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = PAD + col * (cellW + 0.3), cy = curY + row * (cellH + 0.15);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: cx, y: cy, w: cellW, h: cellH, fill: { color: c(theme.lightGray) }, rectRadius: 0.1 });
    // Extract emoji prefix if present
    const emojiMatch = item.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
    const emoji = emojiMatch ? emojiMatch[1] : '●';
    const text = emojiMatch ? item.slice(emojiMatch[0].length) : item;
    slide.addText(emoji, { x: cx, y: cy + 0.15, w: cellW, h: 0.4, fontSize: 18, align: 'center' });
    slide.addText(text, { x: cx + 0.15, y: cy + 0.6, w: cellW - 0.3, h: cellH - 0.75, fontSize: design.bodySize - 3, color: c(theme.text), fontFace: 'Microsoft YaHei', align: 'center', shrinkText: true });
  });
  if (content.insight) renderInsight(slide, content.insight, theme, curY + rows * (cellH + 0.15) + 0.1, CW, PAD, design.insightStyle);
}

// ─── Process Flow ───
function renderProcessFlowLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.5;
  }
  const steps = content.bullets || [];
  const stepW = (CW - 0.2 * (steps.length - 1)) / steps.length;
  // Arrow line
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: curY + 0.55, w: CW, h: 0.04, fill: { color: c(theme.primary), transparency: 40 } });
  steps.forEach((step, i) => {
    const sx = PAD + i * (stepW + 0.2);
    // Circle number
    slide.addShape('ellipse' as PptxGenJS.ShapeType, { x: sx + stepW / 2 - 0.25, y: curY + 0.3, w: 0.5, h: 0.5, fill: { color: c(theme.primary) } });
    slide.addText(`${i + 1}`, { x: sx + stepW / 2 - 0.25, y: curY + 0.3, w: 0.5, h: 0.5, fontSize: 14, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
    // Arrow between steps
    if (i < steps.length - 1) {
      slide.addText('→', { x: sx + stepW - 0.05, y: curY + 0.35, w: 0.4, h: 0.4, fontSize: 16, color: c(theme.primary), align: 'center', bold: true });
    }
    // Step text
    slide.addText(step, { x: sx, y: curY + 0.95, w: stepW, h: 1.2, fontSize: design.bodySize - 3, color: c(theme.text), fontFace: 'Microsoft YaHei', align: 'center', shrinkText: true });
  });
  if (content.insight) renderInsight(slide, content.insight, theme, 5.5, CW, PAD, design.insightStyle);
}

// ─── Funnel ───
function renderFunnelLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.5;
  }
  const items = content.bullets || [];
  const maxW = CW * 0.85;
  const stepH = Math.min(0.8, (5.0 - curY) / items.length);
  items.forEach((item, i) => {
    const ratio = 1 - (i / items.length) * 0.5; // Narrows from 100% to 50%
    const barW = maxW * ratio;
    const barX = PAD + (CW - barW) / 2;
    const opacity = Math.round(30 + (i / items.length) * 50);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: barX, y: curY, w: barW, h: stepH - 0.08, fill: { color: c(theme.primary), transparency: opacity }, rectRadius: 0.06 });
    slide.addText(item, { x: barX + 0.15, y: curY, w: barW - 0.3, h: stepH - 0.08, fontSize: design.bodySize - 2, color: c(theme.text), fontFace: 'Microsoft YaHei', align: 'center', valign: 'middle', shrinkText: true });
    curY += stepH;
  });
  if (content.keyMetrics?.length) renderKeyMetrics(slide, content.keyMetrics, theme, design, curY + 0.2, CW);
  if (content.insight) renderInsight(slide, content.insight, theme, curY + (content.keyMetrics?.length ? 1.7 : 0.2), CW, PAD, design.insightStyle);
}

// ─── Summary / Action ───
function renderSummary(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 0.12, fill: { color: c(theme.primary) } });
  slide.addText(content.title || '总结与下一步', { x: PAD, y: 0.35, w: CW, h: 0.65, fontSize: design.titleSize - 2, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei' });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 0.98, w: 1.5, h: 0.04, fill: { color: c(theme.accent) } });
  let curY = 1.2;
  if (content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets, theme, design, curY, CW);
  addFooter(slide, theme, design, pageNum, total);
}

// ─── Comparison ───
function renderComparison(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  slide.addText(content.title, { x: PAD, y: 0.3, w: CW, h: 0.6, fontSize: design.titleSize - 4, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei' });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 0.88, w: 1.2, h: 0.04, fill: { color: c(theme.accent) } });
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), italic: design.subtitleItalic, fontFace: 'Microsoft YaHei' });
    curY += 0.45;
  }
  // Table-based comparison if tableData exists
  if (content.tableData?.headers?.length) {
    renderTable(slide, content.tableData, theme, design, PAD, curY, CW);
  } else {
    // Bullet-based two-column comparison
    const bullets = content.bullets || [];
    const mid = Math.ceil(bullets.length / 2);
    const colW = (CW - 0.4) / 2;
    // Extract labels from first bullet of each column, or use defaults
    const labelA = bullets.length >= 2 ? bullets[0].split(/[：:]/)[0].substring(0, 15) : '方案 A';
    const labelB = bullets.length >= 2 ? bullets[mid]?.split(/[：:]/)[0].substring(0, 15) || '方案 B' : '方案 B';
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD, y: curY, w: colW, h: 0.4, fill: { color: c(theme.primary) }, rectRadius: 0.06 });
    slide.addText(labelA, { x: PAD, y: curY, w: colW, h: 0.4, fontSize: 11, color: 'FFFFFF', align: 'center', bold: true });
    renderBullets(slide, bullets.slice(0, mid), theme, design, curY + 0.5, colW, PAD);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: PAD + colW + 0.4, y: curY, w: colW, h: 0.4, fill: { color: c(theme.accent) }, rectRadius: 0.06 });
    slide.addText(labelB, { x: PAD + colW + 0.4, y: curY, w: colW, h: 0.4, fontSize: 11, color: 'FFFFFF', align: 'center', bold: true });
    renderBullets(slide, bullets.slice(mid), theme, design, curY + 0.5, colW, PAD + colW + 0.4);
  }
  if (content.insight) renderInsight(slide, content.insight, theme, 5.8, CW, PAD, design.insightStyle);
  addFooter(slide, theme, design, pageNum, total);
}

// ─── Timeline ───
function renderTimeline(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  slide.addText(content.title, { x: PAD, y: 0.3, w: CW, h: 0.6, fontSize: design.titleSize - 4, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei' });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 0.88, w: 1.2, h: 0.04, fill: { color: c(theme.accent) } });
  const items = content.bullets || [];
  if (items.length > 0) {
    const lineY = 3.0;
    slide.addShape('rect' as PptxGenJS.ShapeType, { x: 1.0, y: lineY, w: CW - 0.6, h: 0.04, fill: { color: c(theme.primary) } });
    const stepW = (CW - 0.6) / items.length;
    items.forEach((item, i) => {
      const cx = 1.0 + i * stepW + stepW / 2;
      slide.addShape('ellipse' as PptxGenJS.ShapeType, { x: cx - 0.22, y: lineY - 0.2, w: 0.44, h: 0.44, fill: { color: c(theme.primary) } });
      slide.addText(`${i + 1}`, { x: cx - 0.22, y: lineY - 0.2, w: 0.44, h: 0.44, fontSize: 11, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
      slide.addText(item, { x: cx - stepW / 2 + 0.1, y: lineY + 0.4, w: stepW - 0.2, h: 1.2, fontSize: 9, color: c(theme.text), align: 'center', fontFace: 'Microsoft YaHei' });
    });
  }
  if (content.insight) renderInsight(slide, content.insight, theme, 5.5, CW, PAD, design.insightStyle);
  addFooter(slide, theme, design, pageNum, total);
}

// ─── Main export ───
export async function generatePptx(slides: SlideContent[], themeKey: StyleTheme, topic: string): Promise<Buffer> {
  const theme = themes[themeKey] || themes.google;
  const design = themeDesigns[themeKey] || themeDesigns.google;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Gammer';
  pptx.title = topic;
  const total = slides.length;

  for (let i = 0; i < slides.length; i++) {
    const content = slides[i];
    const slide = pptx.addSlide();
    slide.background = { fill: c(theme.background) };
    // Merge source into notes (not displayed on slide)
    let notes = content.notes || '';
    if (content.source) notes += `\n\n数据来源: ${content.source}`;
    if (notes.trim()) slide.addNotes(notes.trim());
    switch (content.type) {
      case 'cover': renderCover(slide, content, theme, design); break;
      case 'toc': renderToc(slide, content, theme, design, total); break;
      case 'summary': case 'action': renderSummary(slide, content, theme, design, i + 1, total); break;
      case 'comparison': renderComparison(slide, content, theme, design, i + 1, total); break;
      case 'timeline': renderTimeline(slide, content, theme, design, i + 1, total); break;
      default: renderContentSlide(slide, content, theme, design, i + 1, total); break;
    }
  }
  return await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
}
