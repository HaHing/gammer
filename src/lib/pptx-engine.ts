import PptxGenJS from 'pptxgenjs';
import type { SlideContent, StyleTheme, ThemeConfig } from './types';
import { themes } from './themes';
import { themeDesigns, ThemeDesign } from './theme-design';
import { parseMermaidFlowchart } from './mermaid-parser';
import { layoutFlowchart } from './mermaid-layout';
import type { LayoutResult } from './mermaid-layout';

// LAYOUT_WIDE = 13.33" x 7.5"
const W = 13.33;
const PAD = 0.7;       // left/right padding
const CW = W - PAD * 2; // content width = 11.93"
const MAX_Y = 6.5;     // stop rendering before footer zone (footer starts ~7.1)

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
    if (y + 0.55 > MAX_Y) return;
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
  const charsPerLine = Math.floor((w - 0.35) * 5.5);
  for (let i = 0; i < bullets.length; i++) {
    if (y >= MAX_Y) break;
    const b = bullets[i];
    const lines = Math.max(1, Math.ceil(b.length / charsPerLine));
    const rowH = Math.min(Math.max(0.38, lines * 0.22), MAX_Y - y);
    const prefix = design.bulletStyle === 'number' ? `${i + 1}.` : char;
    slide.addText(prefix, { x, y, w: 0.35, h: rowH, fontSize: design.bulletStyle === 'number' ? 11 : 8, color: i === 0 ? c(theme.accent) : c(theme.primary), bold: true, align: 'center', valign: 'top' });
    // Parse "Label：content" pattern for visual hierarchy
    const colonMatch = b.match(/^(.{2,20})[：:]\s*(.+)$/);
    if (colonMatch) {
      const labelW = Math.min(colonMatch[1].length * 0.16 + 0.1, w * 0.35);
      slide.addText(colonMatch[1] + '：', { x: x + 0.35, y, w: labelW, h: rowH, fontSize: design.bodySize - 1, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei', valign: 'top' });
      slide.addText(colonMatch[2], { x: x + 0.35 + labelW, y, w: w - 0.35 - labelW, h: rowH, fontSize: design.bodySize - 1, color: c(theme.text), fontFace: 'Microsoft YaHei', shrinkText: true, valign: 'top' });
    } else {
      slide.addText(b, { x: x + 0.35, y, w: w - 0.35, h: rowH, fontSize: design.bodySize - 1, color: c(theme.text), fontFace: 'Microsoft YaHei', shrinkText: true, valign: 'top' });
    }
    y += rowH + 0.06;
  }
  return y;
}

function renderChart(slide: PptxGenJS.Slide, chartData: SlideContent['chartData'], theme: ThemeConfig, x: number, y: number, w: number, h: number, chartType?: string) {
  if (!chartData || chartData.length === 0) return;

  if (chartType === 'pie' || chartType === 'doughnut') {
    renderPieChart(slide, chartData, theme, x, y, w, h, chartType === 'doughnut');
    return;
  }

  if (chartType === 'line') {
    const chartDataFormatted = [{ name: 'Data', labels: chartData.map(d => d.label), values: chartData.map(d => d.value) }];
    slide.addChart('line', chartDataFormatted, {
      x, y, w, h, showLegend: false, showTitle: false,
      lineDataSymbol: 'circle', lineDataSymbolSize: 6,
      chartColors: [c(theme.primary)],
      valAxisLabelFontSize: 8, catAxisLabelFontSize: 8,
      dataLabelFontSize: 8, showValue: true,
    } as PptxGenJS.IChartOpts);
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
    case 'pyramid': renderPyramidLayout(slide, content, theme, design); break;
    case 'problem-solution': renderProblemSolutionLayout(slide, content, theme, design); break;
    case 'highlight': renderHighlightLayout(slide, content, theme, design); break;
    case 'diagram': renderDiagramLayout(slide, content, theme); break;
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
  if (curY < MAX_Y && content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (curY < MAX_Y && content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (curY < MAX_Y && content.bullets?.length) renderBullets(slide, content.bullets, theme, design, curY, CW);
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
    // Limit rows to fit within available space
    const maxRows = Math.floor((MAX_Y - curY - 1.0) / 0.38);
    const limitedData = { headers: content.tableData.headers, rows: content.tableData.rows.slice(0, Math.max(3, maxRows)) };
    curY = renderTable(slide, limitedData, theme, design, PAD, curY, CW);
  }
  if (curY < MAX_Y && content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (curY < MAX_Y && content.bullets?.length) renderBullets(slide, content.bullets.slice(0, 3), theme, design, curY, CW);
}

function renderChartFocusLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.4;
  }
  if (content.chartData?.length) {
    const chartH = Math.min(3.0, MAX_Y - curY - 1.5); // leave room for insight+bullets
    if (chartH > 1.0) { renderChart(slide, content.chartData, theme, 1.5, curY, CW - 1.6, chartH, content.chartType); curY += chartH + 0.2; }
  }
  if (curY < MAX_Y && content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (curY < MAX_Y && content.bullets?.length) renderBullets(slide, content.bullets.slice(0, 3), theme, design, curY, CW);
}

function renderDefaultLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.05;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), italic: design.subtitleItalic, fontFace: 'Microsoft YaHei' });
    curY += 0.42;
  }
  if (curY < MAX_Y && content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (curY < MAX_Y && content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (curY < MAX_Y && content.bullets?.length) curY = renderBullets(slide, content.bullets, theme, design, curY, CW);
  if (curY < MAX_Y && content.chartData?.length) renderChart(slide, content.chartData, theme, PAD, curY, CW, Math.min(2.2, MAX_Y - curY), content.chartType);
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
  const cellH = Math.min(1.6, (MAX_Y - curY - 0.3) / rows);
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
  const stepH = Math.min(0.8, (MAX_Y - curY - 0.5) / Math.max(items.length, 1));
  items.forEach((item, i) => {
    if (curY >= MAX_Y) return;
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

// ─── Pyramid (战略-战术-执行) ───
function renderPyramidLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.5;
  }
  const items = content.bullets || [];
  const layers = items.slice(0, 4);
  layers.forEach((item, i) => {
    const ratio = 0.3 + (i / layers.length) * 0.6;
    const barW = CW * ratio;
    const barX = PAD + (CW - barW) / 2;
    const h = 0.9;
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: barX, y: curY, w: barW, h, fill: { color: i === 0 ? c(theme.primary) : c(theme.lightGray) }, rectRadius: 0.06 });
    slide.addText(item, { x: barX + 0.15, y: curY, w: barW - 0.3, h, fontSize: design.bodySize - 2, color: i === 0 ? 'FFFFFF' : c(theme.text), fontFace: 'Microsoft YaHei', align: 'center', valign: 'middle', shrinkText: true });
    curY += h + 0.1;
  });
  if (curY < MAX_Y && content.insight) renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
}

// ─── Problem-Solution (问题-原因-对策) ───
function renderProblemSolutionLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  let curY = 1.1;
  if (content.subtitle) {
    slide.addText(content.subtitle, { x: PAD, y: curY, w: CW, h: 0.35, fontSize: design.bodySize - 2, color: c(theme.secondary), fontFace: 'Microsoft YaHei' });
    curY += 0.5;
  }
  const items = content.bullets || [];
  const third = Math.ceil(items.length / 3);
  const cols = [items.slice(0, third), items.slice(third, third * 2), items.slice(third * 2)];
  const headers = ['问题', '原因', '对策'];
  const colW = (CW - 0.4) / 3;
  cols.forEach((col, ci) => {
    const cx = PAD + ci * (colW + 0.2);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: cx, y: curY, w: colW, h: 0.4, fill: { color: ci === 2 ? c(theme.primary) : c(theme.lightGray) }, rectRadius: 0.04 });
    slide.addText(headers[ci], { x: cx, y: curY, w: colW, h: 0.4, fontSize: 12, color: ci === 2 ? 'FFFFFF' : c(theme.primary), fontFace: 'Microsoft YaHei', align: 'center', valign: 'middle', bold: true });
    col.forEach((item, j) => {
      const iy = curY + 0.5 + j * 0.5;
      if (iy < MAX_Y) slide.addText(item, { x: cx + 0.1, y: iy, w: colW - 0.2, h: 0.45, fontSize: design.bodySize - 2, color: c(theme.text), fontFace: 'Microsoft YaHei', shrinkText: true });
    });
  });
}

// ─── Highlight (关键数据高亮) ───
function renderHighlightLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign) {
  const m = content.keyMetrics?.[0];
  if (m) {
    slide.addText(`${m.value}${m.unit ? ' ' + m.unit : ''}`, { x: PAD, y: 1.5, w: CW, h: 1.5, fontSize: 48, color: c(theme.primary), fontFace: 'Microsoft YaHei', align: 'center', valign: 'middle', bold: true });
    slide.addText(m.label, { x: PAD, y: 3.0, w: CW, h: 0.5, fontSize: 16, color: c(theme.secondary), fontFace: 'Microsoft YaHei', align: 'center' });
  }
  if (content.insight) renderInsight(slide, content.insight, theme, 3.8, CW, PAD, design.insightStyle);
  if (content.bullets?.length) renderBullets(slide, content.bullets.slice(0, 3), theme, design, 4.6, CW);
}

// ─── Summary / Action ───
function renderSummary(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig, design: ThemeDesign, pageNum: number, total: number) {
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 0.12, fill: { color: c(theme.primary) } });
  slide.addText(content.title || '总结与下一步', { x: PAD, y: 0.35, w: CW, h: 0.65, fontSize: design.titleSize - 2, color: c(theme.primary), bold: true, fontFace: 'Microsoft YaHei' });
  slide.addShape('rect' as PptxGenJS.ShapeType, { x: PAD, y: 0.98, w: 1.5, h: 0.04, fill: { color: c(theme.accent) } });
  let curY = 1.2;
  if (content.keyMetrics?.length) curY = renderKeyMetrics(slide, content.keyMetrics, theme, design, curY, CW);
  if (curY < MAX_Y && content.insight) curY = renderInsight(slide, content.insight, theme, curY, CW, PAD, design.insightStyle);
  if (curY < MAX_Y && content.bullets?.length) renderBullets(slide, content.bullets, theme, design, curY, CW);
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

// ─── draw.io XML → PptxGenJS native shapes ───

interface DrawioCell {
  id: string;
  value: string;
  isEdge: boolean;
  isVertex: boolean;
  style: string;
  parent: string;
  source: string;
  target: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function stripHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function parseDrawioCells(xml: string): DrawioCell[] {
  const cells: DrawioCell[] = [];
  // Match both self-closing <mxCell .../> and <mxCell ...>...</mxCell>
  const cellRegex = /<mxCell\s+([\s\S]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/g;
  let m;
  while ((m = cellRegex.exec(xml)) !== null) {
    const attrs = m[1];
    const inner = m[2] ?? '';
    const id = attrs.match(/id="([^"]*?)"/)?.[1] ?? '';
    if (id === '0' || id === '1') continue;
    const rawValue = attrs.match(/value="([^"]*?)"/)?.[1] ?? '';
    const value = stripHtml(rawValue);
    const isEdge = /edge="1"/.test(attrs);
    const isVertex = /vertex="1"/.test(attrs);
    const style = attrs.match(/style="([^"]*?)"/)?.[1] ?? '';
    const parent = attrs.match(/parent="([^"]*?)"/)?.[1] ?? '1';
    const source = attrs.match(/source="([^"]*?)"/)?.[1] ?? '';
    const target = attrs.match(/target="([^"]*?)"/)?.[1] ?? '';
    // Parse geometry from inner content or inline attributes
    const geo = inner.match(/<mxGeometry\s+([\s\S]*?)\/?>/) ?? inner.match(/<mxGeometry\s+([\s\S]*?)>[\s\S]*?<\/mxGeometry>/);
    const geoAttrs = geo?.[1] ?? '';
    const x = parseFloat(geoAttrs.match(/\bx="([^"]+)"/)?.[1] ?? '0');
    const y = parseFloat(geoAttrs.match(/\by="([^"]+)"/)?.[1] ?? '0');
    const w = parseFloat(geoAttrs.match(/\bwidth="([^"]+)"/)?.[1] ?? '0');
    const h = parseFloat(geoAttrs.match(/\bheight="([^"]+)"/)?.[1] ?? '0');
    cells.push({ id, value, isEdge, isVertex, style, parent, source, target, x, y, w, h });
  }
  return cells;
}

function renderDrawioPptx(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig) {
  const primaryC = c(theme.primary);
  const accentC = c(theme.accent);
  const secondaryC = c(theme.secondary);
  const textC = c(theme.text);
  const lightC = c(theme.lightGray);

  const cells = parseDrawioCells(content.drawioXml ?? '');
  const vertices = cells.filter(c => c.isVertex && !c.isEdge);
  const edges = cells.filter(c => c.isEdge);

  if (vertices.length === 0) {
    slide.addText('图表内容请在编辑器中查看', {
      x: PAD, y: 3, w: CW, h: 1,
      fontSize: 14, color: lightC, align: 'center', valign: 'middle',
    });
    return;
  }

  // Compute absolute positions (children are relative to parent)
  const cellMap = new Map(cells.map(c => [c.id, c]));
  function absPos(cell: DrawioCell): { x: number; y: number; w: number; h: number } {
    let ax = cell.x, ay = cell.y;
    let p = cell.parent;
    while (p && p !== '1' && p !== '0') {
      const pc = cellMap.get(p);
      if (!pc) break;
      ax += pc.x;
      ay += pc.y;
      p = pc.parent;
    }
    return { x: ax, y: ay, w: cell.w || 120, h: cell.h || 40 };
  }

  // Find bounding box of all vertices
  const positions = vertices.map(v => absPos(v));
  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxX = Math.max(...positions.map(p => p.x + p.w));
  const maxY = Math.max(...positions.map(p => p.y + p.h));
  const srcW = maxX - minX || 1;
  const srcH = maxY - minY || 1;

  // Map to PPTX coordinates
  const hasBullets = content.bullets && content.bullets.length > 0;
  const dstX = PAD;
  const dstY = 1.2;
  const dstW = hasBullets ? CW * 0.55 : CW;
  const dstH = MAX_Y - dstY - 0.4;
  const scale = Math.min(dstW / srcW, dstH / srcH, 0.012); // cap scale to avoid giant shapes

  function mapX(v: number) { return dstX + (v - minX) * scale; }
  function mapY(v: number) { return dstY + (v - minY) * scale; }
  function mapW(v: number) { return Math.max(v * scale, 0.3); }
  function mapH(v: number) { return Math.max(v * scale, 0.2); }

  // Separate containers (swimlanes) from leaf nodes
  const childParents = new Set(vertices.map(v => v.parent));
  const containers = vertices.filter(v => childParents.has(v.id));
  const leafNodes = vertices.filter(v => !childParents.has(v.id));

  // 1. Render containers (swimlanes) as dashed backgrounds
  for (const ct of containers) {
    const pos = absPos(ct);
    const px = mapX(pos.x), py = mapY(pos.y), pw = mapW(pos.w), ph = mapH(pos.h);
    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
      x: px, y: py, w: pw, h: ph,
      fill: { color: primaryC, transparency: 94 },
      line: { color: primaryC, width: 0.5, dashType: 'dash' },
      rectRadius: 0.06,
    });
    if (ct.value) {
      slide.addText(ct.value, {
        x: px + 0.05, y: py + 0.03, w: pw - 0.1, h: 0.2,
        fontSize: 7, color: secondaryC, bold: true, fontFace: 'Microsoft YaHei',
      });
    }
  }

  // 2. Render edges
  for (const edge of edges) {
    const src = cellMap.get(edge.source);
    const tgt = cellMap.get(edge.target);
    if (!src || !tgt) continue;
    const sp = absPos(src), tp = absPos(tgt);
    const sx = mapX(sp.x) + mapW(sp.w) / 2;
    const sy = mapY(sp.y) + mapH(sp.h) / 2;
    const tx = mapX(tp.x) + mapW(tp.w) / 2;
    const ty = mapY(tp.y) + mapH(tp.h) / 2;
    slide.addShape('line' as PptxGenJS.ShapeType, {
      x: sx, y: sy, w: tx - sx, h: ty - sy,
      line: { color: secondaryC, width: 0.8, endArrowType: 'arrow' },
    });
    if (edge.value) {
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      const lw = Math.max(0.4, edge.value.length * 0.07 + 0.15);
      slide.addText(edge.value, {
        x: mx - lw / 2, y: my - 0.1, w: lw, h: 0.2,
        fontSize: 6, color: secondaryC, align: 'center', valign: 'middle',
        fontFace: 'Microsoft YaHei',
      });
    }
  }

  // 3. Render leaf nodes
  for (const node of leafNodes) {
    const pos = absPos(node);
    const nx = mapX(pos.x), ny = mapY(pos.y), nw = mapW(pos.w), nh = mapH(pos.h);
    const st = node.style;
    const isDb = /shape=cylinder|shape=mxgraph\.flowchart\.database/i.test(st);
    const isCloud = /ellipse|shape=cloud/i.test(st);
    const isDecision = /rhombus/i.test(st);
    const shapeType = isDb ? 'flowChartMagneticDisk' : isCloud ? 'flowChartConnector' : isDecision ? 'flowChartDecision' : 'roundRect';
    const bg = isDb ? accentC : isDecision ? lightenHex(primaryC, 0.88) : 'FFFFFF';
    const fg = isDb ? 'FFFFFF' : isDecision ? primaryC : textC;
    const border = isDb ? accentC : primaryC;

    slide.addShape(shapeType as PptxGenJS.ShapeType, {
      x: nx, y: ny, w: nw, h: nh,
      fill: { color: bg },
      line: { color: border, width: 0.8 },
      rectRadius: isDecision ? 0 : 0.05,
      shadow: { type: 'outer', blur: 2, offset: 1, color: '00000015', opacity: 0.08 },
    });
    if (node.value) {
      slide.addText(node.value, {
        x: nx, y: ny, w: nw, h: nh,
        fontSize: nw < 0.6 ? 6 : 8, color: fg, bold: true,
        align: 'center', valign: 'middle', fontFace: 'Microsoft YaHei', shrinkText: true,
      });
    }
  }

  // Right side: bullets
  if (hasBullets && content.bullets) {
    const bulletsX = PAD + CW * 0.58;
    const bulletsW = CW * 0.42;
    const bulletRows = content.bullets.map(b => ({
      text: b,
      options: { fontSize: 9, color: textC, bullet: { code: '25CF', color: primaryC }, breakLine: true },
    }));
    slide.addText(bulletRows as PptxGenJS.TextProps[], {
      x: bulletsX, y: dstY, w: bulletsW, h: dstH,
      valign: 'top', lineSpacingMultiple: 1.5,
    });
  }
}

function renderDiagramLayout(slide: PptxGenJS.Slide, content: SlideContent, theme: ThemeConfig) {
  // draw.io XML: parse node labels → render as native process-flow + bullets
  if (content.diagramType === 'drawio' && content.drawioXml) {
    renderDrawioPptx(slide, content, theme);
    return;
  }

  // Priority: mermaidCode > diagramDescription (legacy)
  if (content.mermaidCode) {
    const graph = parseMermaidFlowchart(content.mermaidCode);
    if (graph.nodes.length > 1) {
      const bounds = { x: PAD, y: 1.3, w: CW, h: MAX_Y - 1.3 - 0.5 };
      const layout = layoutFlowchart(graph, bounds);
      renderMermaidPptx(slide, layout, theme);
      return;
    }
  }

  // Legacy: "A → B → C" format
  if (content.diagramDescription) {
    renderLegacyDiagram(slide, content.diagramDescription, theme);
  }
}

// ─── Mermaid → PptxGenJS native shapes ───
function renderMermaidPptx(slide: PptxGenJS.Slide, layout: LayoutResult, theme: ThemeConfig) {
  const primaryC = c(theme.primary);
  const accentC = c(theme.accent);
  const secondaryC = c(theme.secondary);
  const textC = c(theme.text);
  const lightC = c(theme.lightGray);
  const MIN_NODE_W = 0.55;
  const MIN_NODE_H = 0.32;

  // Pre-compute a light tint of primary color (for diamond/decision nodes)
  const primaryTint = lightenHex(primaryC, 0.88);

  // 1. Render subgraph backgrounds
  for (const sg of layout.subgraphs) {
    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
      x: sg.x, y: sg.y, w: sg.w, h: sg.h,
      fill: { color: primaryC, transparency: 92 },
      line: { color: primaryC, width: 0.5, dashType: 'dash' },
      rectRadius: 0.1,
    });
    slide.addText(sg.label, {
      x: sg.x + 0.1, y: sg.y + 0.05, w: sg.w - 0.2, h: 0.22,
      fontSize: 7, color: secondaryC, bold: true, fontFace: 'Microsoft YaHei',
    });
  }

  // 2. Render edges (behind nodes) using dagre's computed control points
  for (const edge of layout.edges) {
    const pts = edge.points;
    if (pts.length < 2) continue;

    const dashType = edge.style === 'dotted' ? 'dash' : 'solid';
    const lineW = edge.style === 'thick' ? 2.5 : 1.0;

    // Draw polyline segments following dagre's control points
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const isLast = i === pts.length - 2;

      slide.addShape('line' as PptxGenJS.ShapeType, {
        x: p1.x, y: p1.y,
        w: p2.x - p1.x, h: p2.y - p1.y,
        line: {
          color: secondaryC,
          width: lineW,
          dashType: dashType as 'solid' | 'dash',
          endArrowType: isLast && edge.arrow ? 'arrow' : undefined,
        },
      });
    }

    // Edge label at midpoint with white background pill
    if (edge.label) {
      const midIdx = Math.floor(pts.length / 2);
      const mid = pts.length % 2 === 0
        ? { x: (pts[midIdx - 1].x + pts[midIdx].x) / 2, y: (pts[midIdx - 1].y + pts[midIdx].y) / 2 }
        : pts[midIdx];
      const labelW = Math.max(0.5, edge.label.length * 0.08 + 0.2);
      slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x: mid.x - labelW / 2, y: mid.y - 0.12, w: labelW, h: 0.24,
        fill: { color: 'FFFFFF' },
        line: { color: lightC, width: 0.3 },
        rectRadius: 0.06,
      });
      slide.addText(edge.label, {
        x: mid.x - labelW / 2, y: mid.y - 0.12, w: labelW, h: 0.24,
        fontSize: 7, color: secondaryC, align: 'center', valign: 'middle',
        fontFace: 'Microsoft YaHei',
      });
    }
  }

  // 3. Render nodes — color by shape semantics, not position
  for (const node of layout.nodes) {
    let bg: string, fg: string, border: string;

    switch (node.shape) {
      case 'circle':   // start/end terminals
      case 'stadium':  // input/output
        bg = primaryC; fg = 'FFFFFF'; border = primaryC;
        break;
      case 'diamond':  // decision point
        bg = primaryTint; fg = primaryC; border = primaryC;
        break;
      case 'cylinder': // database/storage
        bg = accentC; fg = 'FFFFFF'; border = accentC;
        break;
      case 'hexagon':  // preparation/special
        bg = secondaryC; fg = 'FFFFFF'; border = secondaryC;
        break;
      default:         // rect, rounded — process steps
        bg = 'F3F4F6'; fg = textC; border = primaryC;
        break;
    }

    const drawW = Math.max(node.w, MIN_NODE_W);
    const drawH = Math.max(node.h, MIN_NODE_H);
    const nodeX = node.x - drawW / 2;
    const nodeY = node.y - drawH / 2;
    const shapeType = mapShapeToPptx(node.shape);

    slide.addShape(shapeType as PptxGenJS.ShapeType, {
      x: nodeX, y: nodeY, w: drawW, h: drawH,
      fill: { color: bg },
      line: { color: border, width: 1, dashType: 'solid' },
      rectRadius: node.shape === 'rounded' || node.shape === 'stadium' ? 0.15 : 0.05,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '00000020', opacity: 0.12 },
    });

    slide.addText(node.label, {
      x: nodeX, y: nodeY, w: drawW, h: drawH,
      fontSize: drawW < 0.8 ? 6 : node.shape === 'diamond' ? 8 : 9,
      color: fg, bold: true, align: 'center', valign: 'middle',
      fontFace: 'Microsoft YaHei', shrinkText: true,
    });
  }
}

// Lighten a 6-digit hex color toward white by a given factor (0 = original, 1 = white)
function lightenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return [lr, lg, lb].map(v => v.toString(16).padStart(2, '0')).join('');
}

function mapShapeToPptx(shape: string): string {
  switch (shape) {
    case 'diamond': return 'flowChartDecision';
    case 'circle': return 'flowChartConnector';
    case 'stadium': return 'flowChartTerminator';
    case 'hexagon': return 'flowChartPreparation';
    case 'cylinder': return 'flowChartMagneticDisk';
    case 'rounded': return 'flowChartAlternateProcess';
    case 'rect':
    default: return 'flowChartProcess';
  }
}

// ─── Legacy diagram renderer (A → B → C format) ───
function renderLegacyDiagram(slide: PptxGenJS.Slide, description: string, theme: ThemeConfig) {
  const nodes = description.split(/[→➜⟶;；]/).map(s => s.replace(/^[：:]\s*/, '').trim()).filter(Boolean);
  if (nodes.length > 1) {
    const maxPerRow = Math.min(nodes.length, 5);
    const rows = Math.ceil(nodes.length / maxPerRow);
    const boxW = Math.min((CW - 0.3 * (maxPerRow - 1)) / maxPerRow, 2.2);
    const arrowW = 0.3;
    const totalW = nodes.length <= maxPerRow ? boxW * maxPerRow + arrowW * (maxPerRow - 1) : CW;
    const startX = PAD + (CW - totalW) / 2;
    for (let r = 0; r < rows; r++) {
      const rowNodes = nodes.slice(r * maxPerRow, (r + 1) * maxPerRow);
      const rowY = 1.5 + r * 1.8;
      for (let i = 0; i < rowNodes.length; i++) {
        const nx = startX + i * (boxW + arrowW);
        const isFirst = r === 0 && i === 0;
        const isLast = r === rows - 1 && i === rowNodes.length - 1;
        const bg = isFirst ? c(theme.primary) : isLast ? c(theme.accent) : 'F3F4F6';
        const fg = isFirst || isLast ? 'FFFFFF' : c(theme.primary);
        slide.addShape('roundRect' as PptxGenJS.ShapeType, { x: nx, y: rowY, w: boxW, h: 0.9, fill: { color: bg }, rectRadius: 0.1, line: { color: isFirst || isLast ? bg : c(theme.primary), width: 0.5, dashType: 'solid' } });
        const m = rowNodes[i].match(/^(.+?)[（(](.+?)[）)]$/) || rowNodes[i].match(/^(.{2,15})[：:](.+)$/);
        if (m) {
          slide.addText(m[1].trim(), { x: nx, y: rowY + 0.1, w: boxW, h: 0.4, fontSize: 10, color: fg, bold: true, align: 'center', fontFace: 'Microsoft YaHei' });
          slide.addText(m[2].trim(), { x: nx, y: rowY + 0.45, w: boxW, h: 0.35, fontSize: 7, color: isFirst || isLast ? 'FFFFFFCC' : c(theme.secondary), align: 'center', fontFace: 'Microsoft YaHei' });
        } else {
          slide.addText(rowNodes[i], { x: nx, y: rowY, w: boxW, h: 0.9, fontSize: 10, color: fg, bold: true, align: 'center', valign: 'middle', fontFace: 'Microsoft YaHei', shrinkText: true });
        }
        if (i < rowNodes.length - 1) {
          slide.addText('→', { x: nx + boxW, y: rowY, w: arrowW, h: 0.9, fontSize: 16, color: c(theme.secondary), align: 'center', valign: 'middle' });
        }
      }
    }
  } else {
    slide.addText(`📐 ${description}`, { x: PAD, y: 2.5, w: CW, h: 2, fontSize: 14, color: c(theme.secondary), italic: true, align: 'center', valign: 'middle', fontFace: 'Microsoft YaHei' });
  }
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
    // Render source on slide footer area
    if (content.source && content.type !== 'cover') {
      slide.addText(`📎 ${content.source}`, { x: PAD, y: 6.7, w: CW - 1.5, h: 0.3, fontSize: 7, color: c(theme.secondary), italic: true, fontFace: 'Microsoft YaHei' });
    }
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
