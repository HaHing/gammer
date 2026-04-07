export type PageCount = 5 | 10 | 15 | 20 | 25;
export type StyleTheme = 'google' | 'amazon' | 'microsoft' | 'deloitte' | 'pwc' | 'brand';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  lightGray: string;
  description: string;
}

export type SlideType = 'cover' | 'toc' | 'content' | 'data' | 'comparison' | 'timeline' | 'architecture' | 'summary' | 'action' | 'appendix';
export type SlideLayout = 'full-text' | 'text-left-image-right' | 'image-left-text-right' | 'metrics-grid' | 'chart-focus' | 'two-column' | 'three-column' | 'big-number' | 'quote-highlight';

export interface KeyMetric {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface ChartDataItem {
  label: string;
  value: number;
}

export interface SlideContent {
  type: SlideType;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  keyMetrics?: KeyMetric[];
  chartData?: ChartDataItem[];
  insight?: string;
  source?: string;
  notes?: string;
  needsImage: boolean;
  imagePrompt?: string;
  imageUrl?: string;
  // LLM design directives
  designNotes?: string; // LLM can give rendering hints
}
