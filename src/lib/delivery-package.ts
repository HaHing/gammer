import type { ResearchReport } from './research-engine';
import type {
  DeliveryPackage,
  DeliveryRecommendation,
  QualityIssue,
  SlideContent,
  StyleTheme,
} from './types';

interface BuildDeliveryPackageInput {
  topic: string;
  theme: StyleTheme;
  pageCount: number;
  slides: SlideContent[];
  issues: QualityIssue[];
  score: number;
  research?: ResearchReport | null;
}

function toRiskLevel(score: number, errorCount: number): 'low' | 'medium' | 'high' {
  if (errorCount > 0 || score < 65) return 'high';
  if (score < 82) return 'medium';
  return 'low';
}

function summarizeDiagnosis(riskLevel: 'low' | 'medium' | 'high', errorCount: number, warningCount: number): string {
  if (riskLevel === 'high') {
    return `当前内容存在 ${errorCount} 个严重问题、${warningCount} 个提醒，建议先修复后再对外分发。`;
  }
  if (riskLevel === 'medium') {
    return `内容可用但仍有 ${warningCount} 个可优化项，建议做一轮人工精修提升说服力。`;
  }
  return '内容质量稳定，可直接用于内部评审；建议仅做品牌和数据口径复核。';
}

function buildRecommendations(params: {
  riskLevel: 'low' | 'medium' | 'high';
  errorCount: number;
  warningCount: number;
  sourceCount: number;
  slides: SlideContent[];
  keyStatsCount: number;
  score: number;
}): DeliveryRecommendation[] {
  const list: DeliveryRecommendation[] = [];

  if (params.errorCount > 0) {
    list.push({
      id: 'fix-errors-first',
      priority: 'p0',
      action: '先修复全部 error 级问题，再执行导出与分享。',
      reason: 'error 级问题会直接影响叙事完整性和专业可信度。',
    });
  }

  if (params.warningCount >= 4) {
    list.push({
      id: 'reduce-text-density',
      priority: 'p1',
      action: '减少连续文字页，补充 metrics/chart/diagram 等视觉化页。',
      reason: '当前 warning 偏多，视觉节奏和信息承载仍有提升空间。',
    });
  }

  const sourcedSlides = params.slides.filter((s) => s.source && s.source.trim().length > 3).length;
  const sourceCoverage = params.slides.length > 0 ? sourcedSlides / params.slides.length : 0;
  if (sourceCoverage < 0.6 || params.sourceCount < 3) {
    list.push({
      id: 'strengthen-evidence',
      priority: 'p1',
      action: '补充权威来源标注，重点强化关键结论页的数据出处。',
      reason: '来源覆盖率不足会降低管理层对结论的信任度。',
    });
  }

  if (params.keyStatsCount < Math.min(6, Math.max(3, Math.floor(params.slides.length * 0.4)))) {
    list.push({
      id: 'add-key-metrics',
      priority: 'p2',
      action: '增加关键指标对比（现状/目标/差距），形成可执行闭环。',
      reason: '关键指标不足时，行动建议难以落到可量化目标。',
    });
  }

  if (params.riskLevel === 'low' && params.score >= 85 && params.errorCount === 0) {
    list.push({
      id: 'ready-to-publish',
      priority: 'p2',
      action: '可直接进入发布流程，建议补充一页“风险与假设”作为管理兜底。',
      reason: '当前质量评分已达高可用区间，剩余优化以风险沟通为主。',
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'manual-review',
      priority: 'p2',
      action: '进行一次 10 分钟人工复核：标题结论性、数字口径、行动可执行性。',
      reason: '自动质检通过后，人工复核能进一步降低对外沟通风险。',
    });
  }

  return list.slice(0, 4);
}

export function buildDeliveryPackage(input: BuildDeliveryPackageInput): DeliveryPackage {
  const issues = input.issues || [];
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const riskLevel = toRiskLevel(input.score, errorCount);
  const sortedIssues = [...issues].sort((a, b) => {
    const sA = a.severity === 'error' ? 0 : 1;
    const sB = b.severity === 'error' ? 0 : 1;
    if (sA !== sB) return sA - sB;
    return a.page - b.page;
  });

  const findings = input.research?.results?.flatMap((r) => r.findings) || [];
  const topSources = [...new Set(findings.map((f) => f.source).filter(Boolean))].slice(0, 8);
  const keyStatsCount = input.research?.keyStats?.length || 0;

  return {
    version: 'v1',
    generatedAt: new Date().toISOString(),
    score: input.score,
    diagnosis: {
      riskLevel,
      errorCount,
      warningCount,
      topIssues: sortedIssues.slice(0, 5),
      summary: summarizeDiagnosis(riskLevel, errorCount, warningCount),
    },
    evidence: {
      keyStatsCount,
      findingsCount: findings.length,
      sourceCount: topSources.length,
      topSources,
    },
    recommendations: buildRecommendations({
      riskLevel,
      errorCount,
      warningCount,
      sourceCount: topSources.length,
      slides: input.slides,
      keyStatsCount,
      score: input.score,
    }),
    meta: {
      topic: input.topic,
      pageCount: input.pageCount,
      slideCount: input.slides.length,
      theme: input.theme,
    },
  };
}

