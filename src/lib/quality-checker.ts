import type { SlideContent } from './types';

interface QualityIssue {
  page: number;
  issue: string;
  severity: 'error' | 'warning';
}

export function checkQuality(slides: SlideContent[]): { issues: QualityIssue[]; score: number } {
  const issues: QualityIssue[] = [];

  // Structure checks
  if (!slides.some(s => s.type === 'cover')) issues.push({ page: 1, issue: '缺少封面页', severity: 'error' });
  if (!slides.some(s => s.type === 'summary' || s.type === 'action')) issues.push({ page: slides.length, issue: '缺少总结/行动页', severity: 'warning' });

  // Layout diversity — require at least 5 different layouts
  const layouts = new Set(slides.map(s => s.layout));
  if (layouts.size < 5) issues.push({ page: 0, issue: `布局多样性不足（${layouts.size}种），需至少5种`, severity: 'warning' });

  // Data richness: at least 40% of content slides should have keyMetrics or chartData
  const contentSlides = slides.filter(s => !['cover', 'toc'].includes(s.type));
  const dataRichSlides = contentSlides.filter(s => (s.keyMetrics?.length || 0) > 0 || (s.chartData?.length || 0) > 0);
  if (contentSlides.length > 0 && dataRichSlides.length / contentSlides.length < 0.4) {
    issues.push({ page: 0, issue: `数据展示不足（${dataRichSlides.length}/${contentSlides.length}页有数据），需至少40%`, severity: 'warning' });
  }

  // Source coverage: at least 60% of content slides should have source
  const sourcedSlides = contentSlides.filter(s => s.source && s.source.length > 3);
  if (contentSlides.length > 0 && sourcedSlides.length / contentSlides.length < 0.6) {
    issues.push({ page: 0, issue: `数据来源标注不足（${sourcedSlides.length}/${contentSlides.length}页有来源），需至少60%`, severity: 'warning' });
  }

  // Consecutive same layouts
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].layout === slides[i - 1].layout && !['full-text'].includes(slides[i].layout)) {
      issues.push({ page: i + 1, issue: `与上一页使用相同布局(${slides[i].layout})`, severity: 'warning' });
    }
  }

  // Per-slide checks
  slides.forEach((s, i) => {
    const page = i + 1;

    // Title quality
    if (!s.title || s.title.length < 2) {
      issues.push({ page, issue: '标题缺失或过短', severity: 'error' });
    } else if (!['cover', 'toc'].includes(s.type) && s.title.length < 10) {
      issues.push({ page, issue: '标题过短，需使用有观点的结论句', severity: 'warning' });
    }

    // Content richness
    if (!['cover', 'toc'].includes(s.type)) {
      const hasBullets = s.bullets && s.bullets.length >= 3;
      const hasMetrics = s.keyMetrics && s.keyMetrics.length > 0;
      const hasChart = s.chartData && s.chartData.length > 0;
      if (!hasBullets && !hasMetrics && !hasChart) {
        issues.push({ page, issue: '内容不足：需至少3条bullets或数据展示', severity: 'warning' });
      }
    }

    // Layout-specific checks
    if (s.layout === 'metrics-grid' && (!s.keyMetrics || s.keyMetrics.length < 2)) {
      issues.push({ page, issue: 'metrics-grid布局需至少2个keyMetrics', severity: 'warning' });
    }
    if (s.layout === 'chart-focus' && (!s.chartData || s.chartData.length < 3)) {
      issues.push({ page, issue: 'chart-focus布局需至少3个chartData', severity: 'warning' });
    }
    if (s.layout === 'big-number' && (!s.keyMetrics || s.keyMetrics.length === 0)) {
      issues.push({ page, issue: 'big-number布局缺少keyMetrics', severity: 'warning' });
    }

    // Speaker notes
    if (!['cover', 'toc', 'appendix'].includes(s.type) && (!s.notes || s.notes.length < 30)) {
      issues.push({ page, issue: '演讲者备注缺失或过短', severity: 'warning' });
    }

    // Insight check — every content page should have insight
    if (!['cover', 'toc', 'appendix'].includes(s.type) && (!s.insight || s.insight.length < 5)) {
      issues.push({ page, issue: '缺少核心洞察(insight)', severity: 'warning' });
    }
  });

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 15 - warnCount * 3);

  return { issues, score };
}
