import { ThemeConfig, StyleTheme } from './types';

// Theme-specific design tokens that control PPTX rendering behavior
export interface ThemeDesign {
  coverStyle: 'left-block' | 'full-bleed' | 'centered' | 'gradient-bottom' | 'split-diagonal' | 'brand-gradient' | 'haio-dark';
  contentDensity: 'high' | 'medium' | 'balanced';
  bulletStyle: 'square' | 'circle' | 'dash' | 'number' | 'arrow';
  accentPosition: 'left-bar' | 'top-line' | 'bottom-bar' | 'side-stripe';
  chartStyle: 'bar' | 'bar3D' | 'line' | 'doughnut';
  footerStyle: 'minimal' | 'full-bar' | 'thin-line';
  titleSize: number;
  bodySize: number;
  subtitleItalic: boolean;
  useGradient: boolean;
  useCard?: boolean;
  // New: per-theme layout preferences
  preferredLayouts: string[];  // Ordered list of preferred layouts for this theme
  metricsStyle: 'card' | 'inline' | 'large';  // How to render key metrics
  insightStyle: 'bar' | 'box' | 'banner';  // How to render insights
  chartPreference: 'bar' | 'pie' | 'doughnut' | 'line';  // Default chart type
  sectionDivider: boolean;  // Show section divider between major sections
}

export const themeDesigns: Record<StyleTheme, ThemeDesign> = {
  google: {
    coverStyle: 'centered',
    contentDensity: 'balanced',
    bulletStyle: 'circle',
    accentPosition: 'top-line',
    chartStyle: 'bar',
    footerStyle: 'thin-line',
    titleSize: 24,
    bodySize: 13,
    subtitleItalic: false,
    useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'big-number', 'two-column', 'icon-grid'],
    metricsStyle: 'card',
    insightStyle: 'bar',
    chartPreference: 'bar',
    sectionDivider: false,
  },
  amazon: {
    coverStyle: 'left-block',
    contentDensity: 'high',
    bulletStyle: 'number',
    accentPosition: 'left-bar',
    chartStyle: 'bar',
    footerStyle: 'minimal',
    titleSize: 22,
    bodySize: 12,
    subtitleItalic: false,
    useGradient: false,
    preferredLayouts: ['full-text', 'table-focus', 'two-column', 'metrics-grid', 'process-flow'],
    metricsStyle: 'inline',
    insightStyle: 'bar',
    chartPreference: 'bar',
    sectionDivider: false,
  },
  microsoft: {
    coverStyle: 'gradient-bottom',
    contentDensity: 'medium',
    bulletStyle: 'square',
    accentPosition: 'side-stripe',
    chartStyle: 'bar3D',
    footerStyle: 'full-bar',
    titleSize: 24,
    bodySize: 13,
    subtitleItalic: true,
    useGradient: true,
    preferredLayouts: ['icon-grid', 'metrics-grid', 'chart-focus', 'three-column', 'process-flow'],
    metricsStyle: 'card',
    insightStyle: 'box',
    chartPreference: 'bar',
    sectionDivider: true,
  },
  deloitte: {
    coverStyle: 'split-diagonal',
    contentDensity: 'high',
    bulletStyle: 'dash',
    accentPosition: 'top-line',
    chartStyle: 'bar',
    footerStyle: 'full-bar',
    titleSize: 22,
    bodySize: 12,
    subtitleItalic: false,
    useGradient: false,
    preferredLayouts: ['table-focus', 'chart-focus', 'two-column', 'metrics-grid', 'funnel'],
    metricsStyle: 'card',
    insightStyle: 'banner',
    chartPreference: 'bar',
    sectionDivider: true,
  },
  pwc: {
    coverStyle: 'full-bleed',
    contentDensity: 'medium',
    bulletStyle: 'square',
    accentPosition: 'left-bar',
    chartStyle: 'line',
    footerStyle: 'full-bar',
    titleSize: 24,
    bodySize: 13,
    subtitleItalic: true,
    useGradient: false,
    preferredLayouts: ['metrics-grid', 'chart-focus', 'table-focus', 'two-column', 'quote-highlight'],
    metricsStyle: 'large',
    insightStyle: 'box',
    chartPreference: 'line',
    sectionDivider: true,
  },
  brand: {
    coverStyle: 'brand-gradient',
    contentDensity: 'balanced',
    bulletStyle: 'arrow',
    accentPosition: 'side-stripe',
    chartStyle: 'doughnut',
    footerStyle: 'full-bar',
    titleSize: 26,
    bodySize: 14,
    subtitleItalic: false,
    useGradient: true,
    preferredLayouts: ['big-number', 'icon-grid', 'chart-focus', 'quote-highlight', 'funnel'],
    metricsStyle: 'large',
    insightStyle: 'banner',
    chartPreference: 'doughnut',
    sectionDivider: false,
  },
  haio: {
    coverStyle: 'haio-dark',
    contentDensity: 'high',
    bulletStyle: 'circle',
    accentPosition: 'left-bar',
    chartStyle: 'bar',
    footerStyle: 'thin-line',
    titleSize: 22,
    bodySize: 11,
    subtitleItalic: false,
    useGradient: false,
    useCard: true,
    preferredLayouts: ['metrics-grid', 'table-focus', 'two-column', 'chart-focus', 'process-flow'],
    metricsStyle: 'card',
    insightStyle: 'bar',
    chartPreference: 'bar',
    sectionDivider: false,
  },
};
