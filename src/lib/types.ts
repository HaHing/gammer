export type PageCount = 5 | 10 | 15 | 20 | 25;
export type StyleTheme = 'google' | 'amazon' | 'microsoft' | 'deloitte' | 'pwc' | 'brand' | 'haio';

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
export type SlideLayout = 'full-text' | 'text-left-image-right' | 'image-left-text-right' | 'metrics-grid' | 'chart-focus' | 'two-column' | 'three-column' | 'big-number' | 'quote-highlight' | 'table-focus' | 'icon-grid' | 'process-flow' | 'funnel' | 'pyramid' | 'problem-solution' | 'highlight';

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

export type ChartType = 'bar' | 'pie' | 'doughnut' | 'line';

export interface OutlineItem {
  title: string;
  bullets: string[];
  type: SlideType;
  layout: SlideLayout;
}

export interface SlideContent {
  type: SlideType;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  keyMetrics?: KeyMetric[];
  chartData?: ChartDataItem[];
  chartType?: ChartType;
  insight?: string;
  source?: string;
  sourceType?: 'official' | 'research' | 'inferred'; // C2: data provenance
  notes?: string;
  needsImage?: boolean; // deprecated, always false
  tableData?: { headers: string[]; rows: string[][] };
  designNotes?: string;
}
