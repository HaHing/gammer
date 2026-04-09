import { StyleTheme } from './types';

/**
 * 商务风设计规范
 *
 * 字体层级（统一微软雅黑）：
 * - 封面标题：32pt Bold #主色
 * - 一级标题：24pt Bold #主色
 * - 二级标题：18pt Bold #secondary
 * - 正文：13pt Regular #text
 * - 注释/来源：9pt Regular #secondary
 *
 * 排版间距：
 * - 标题行高：1.3x
 * - 正文行高：1.6x
 * - 段前段后：0.4"
 * - 页边距：0.7"
 * - 模块间距：0.3"
 */
export interface ThemeDesign {
  coverStyle: 'left-block' | 'full-bleed' | 'centered' | 'gradient-bottom' | 'split-diagonal' | 'brand-gradient' | 'haio-dark';
  contentDensity: 'high' | 'medium' | 'balanced';
  bulletStyle: 'square' | 'circle' | 'dash' | 'number' | 'arrow';
  accentPosition: 'left-bar' | 'top-line' | 'bottom-bar' | 'side-stripe';
  chartStyle: 'bar' | 'bar3D' | 'line' | 'doughnut';
  footerStyle: 'minimal' | 'full-bar' | 'thin-line';
  titleSize: number;   // 一级标题 pt
  bodySize: number;    // 正文 pt
  subtitleItalic: boolean;
  useGradient: boolean;
  useCard?: boolean;
  preferredLayouts: string[];
  metricsStyle: 'card' | 'inline' | 'large';
  insightStyle: 'bar' | 'box' | 'banner';
  chartPreference: 'bar' | 'pie' | 'doughnut' | 'line';
  sectionDivider: boolean;
  // Typography hierarchy
  coverTitleSize: number;  // 封面标题 pt
  h2Size: number;          // 二级标题 pt
  captionSize: number;     // 注释/来源 pt
}

export const themeDesigns: Record<StyleTheme, ThemeDesign> = {
  google: {
    coverStyle: 'centered',
    contentDensity: 'balanced',
    bulletStyle: 'dash',
    accentPosition: 'top-line',
    chartStyle: 'bar',
    footerStyle: 'thin-line',
    titleSize: 24, bodySize: 13, coverTitleSize: 32, h2Size: 18, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'two-column', 'table-focus', 'process-flow'],
    metricsStyle: 'card', insightStyle: 'bar', chartPreference: 'bar', sectionDivider: false,
  },
  amazon: {
    coverStyle: 'left-block',
    contentDensity: 'high',
    bulletStyle: 'number',
    accentPosition: 'left-bar',
    chartStyle: 'bar',
    footerStyle: 'minimal',
    titleSize: 22, bodySize: 12, coverTitleSize: 30, h2Size: 16, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['full-text', 'table-focus', 'two-column', 'metrics-grid', 'process-flow'],
    metricsStyle: 'inline', insightStyle: 'bar', chartPreference: 'bar', sectionDivider: false,
  },
  microsoft: {
    coverStyle: 'gradient-bottom',
    contentDensity: 'medium',
    bulletStyle: 'square',
    accentPosition: 'side-stripe',
    chartStyle: 'bar',
    footerStyle: 'full-bar',
    titleSize: 24, bodySize: 13, coverTitleSize: 32, h2Size: 18, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'three-column', 'process-flow', 'table-focus'],
    metricsStyle: 'card', insightStyle: 'box', chartPreference: 'bar', sectionDivider: true,
  },
  deloitte: {
    coverStyle: 'split-diagonal',
    contentDensity: 'high',
    bulletStyle: 'dash',
    accentPosition: 'top-line',
    chartStyle: 'bar',
    footerStyle: 'full-bar',
    titleSize: 22, bodySize: 12, coverTitleSize: 30, h2Size: 16, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['table-focus', 'chart-focus', 'two-column', 'metrics-grid', 'funnel'],
    metricsStyle: 'card', insightStyle: 'banner', chartPreference: 'bar', sectionDivider: true,
  },
  pwc: {
    coverStyle: 'full-bleed',
    contentDensity: 'medium',
    bulletStyle: 'square',
    accentPosition: 'left-bar',
    chartStyle: 'bar',
    footerStyle: 'full-bar',
    titleSize: 24, bodySize: 13, coverTitleSize: 32, h2Size: 18, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'table-focus', 'two-column', 'quote-highlight'],
    metricsStyle: 'large', insightStyle: 'box', chartPreference: 'bar', sectionDivider: true,
  },
  brand: {
    coverStyle: 'brand-gradient',
    contentDensity: 'balanced',
    bulletStyle: 'dash',
    accentPosition: 'side-stripe',
    chartStyle: 'bar',
    footerStyle: 'full-bar',
    titleSize: 24, bodySize: 13, coverTitleSize: 32, h2Size: 18, captionSize: 9,
    subtitleItalic: false, useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'two-column', 'quote-highlight', 'process-flow'],
    metricsStyle: 'card', insightStyle: 'banner', chartPreference: 'bar', sectionDivider: false,
  },
  haio: {
    coverStyle: 'haio-dark',
    contentDensity: 'high',
    bulletStyle: 'dash',
    accentPosition: 'left-bar',
    chartStyle: 'bar',
    footerStyle: 'thin-line',
    titleSize: 22, bodySize: 12, coverTitleSize: 30, h2Size: 16, captionSize: 9,
    subtitleItalic: false, useGradient: false, useCard: true,
    preferredLayouts: ['metrics-grid', 'table-focus', 'two-column', 'chart-focus', 'process-flow'],
    metricsStyle: 'card', insightStyle: 'bar', chartPreference: 'bar', sectionDivider: false,
  },
};
