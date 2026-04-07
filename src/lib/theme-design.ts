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
  useCard?: boolean; // Haio-style card container for content slides
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
  },
};
