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

  // Layout diversity — require at least 4 different layouts (relaxed from 5)
  const layouts = new Set(slides.map(s => s.layout));
  if (layouts.size < 4) issues.push({ page: 0, issue: `布局多样性不足（${layouts.size}种），需至少4种`, severity: 'warning' });

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

  // Visual rhythm: flag 3+ consecutive text-heavy layouts (full-text, two-column, three-column)
  const textHeavy = new Set(['full-text', 'two-column', 'three-column']);
  let textRun = 0;
  for (let i = 0; i < slides.length; i++) {
    if (['cover', 'toc'].includes(slides[i].type)) { textRun = 0; continue; }
    if (textHeavy.has(slides[i].layout)) {
      textRun++;
      if (textRun >= 3) {
        issues.push({ page: i + 1, issue: `连续${textRun}页文字密集布局，缺少视觉节奏（建议插入 metrics-grid/chart-focus/diagram/icon-grid）`, severity: 'warning' });
      }
    } else {
      textRun = 0;
    }
  }

  // Visual rhythm: no diagram/process-flow/icon-grid in entire deck
  const visualLayouts = new Set(['diagram', 'process-flow', 'icon-grid', 'funnel', 'pyramid']);
  const hasVisualLayout = contentSlides.some(s => visualLayouts.has(s.layout));
  if (contentSlides.length >= 8 && !hasVisualLayout) {
    issues.push({ page: 0, issue: '缺少视觉化布局（diagram/process-flow/icon-grid），建议至少1页', severity: 'warning' });
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
    if (s.layout === 'table-focus' && (!s.tableData?.headers?.length || !s.tableData?.rows?.length)) {
      issues.push({ page, issue: 'table-focus布局缺少tableData', severity: 'warning' });
    }
    if (s.layout === 'icon-grid' && (!s.bullets || s.bullets.length < 3)) {
      issues.push({ page, issue: 'icon-grid布局需至少3个bullets', severity: 'warning' });
    }
    if (s.layout === 'process-flow' && (!s.bullets || s.bullets.length < 3)) {
      issues.push({ page, issue: 'process-flow布局需至少3个步骤', severity: 'warning' });
    }
    if (s.layout === 'funnel' && (!s.bullets || s.bullets.length < 3)) {
      issues.push({ page, issue: 'funnel布局需至少3个层级', severity: 'warning' });
    }
    if (s.layout === 'pyramid' && (!s.bullets || s.bullets.length < 3)) {
      issues.push({ page, issue: 'pyramid布局需至少3个层级', severity: 'warning' });
    }
    if (s.layout === 'problem-solution' && (!s.bullets || s.bullets.length < 3)) {
      issues.push({ page, issue: 'problem-solution布局需至少3条内容', severity: 'warning' });
    }
    if (s.layout === 'highlight' && (!s.keyMetrics || s.keyMetrics.length === 0)) {
      issues.push({ page, issue: 'highlight布局需至少1个keyMetric', severity: 'warning' });
    }

    // Speaker notes — only flag if completely missing (not just short)
    if (!['cover', 'toc', 'appendix'].includes(s.type) && !s.notes) {
      issues.push({ page, issue: '演讲者备注缺失', severity: 'warning' });
    }
  });

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 15 - warnCount * 3);

  return { issues, score };
}
