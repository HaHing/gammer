import type { PageCount, StyleTheme } from '@/lib/types';

export interface Template {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultTheme: StyleTheme;
  defaultPageCount: PageCount;
}

export const templates: Template[] = [
  { id: 'tech-review', name: '技术方案评审', icon: '🔧', description: '技术选型、架构升级、新技术引入', defaultTheme: 'google', defaultPageCount: 15 },
  { id: 'milestone', name: '项目里程碑汇报', icon: '📊', description: '进度汇报、风险预警、资源协调', defaultTheme: 'brand', defaultPageCount: 10 },
  { id: 'arch-review', name: '架构设计评审', icon: '🏗️', description: '系统架构、技术债务、演进路线', defaultTheme: 'microsoft', defaultPageCount: 15 },
  { id: 'postmortem', name: '故障复盘', icon: '🔥', description: '根因分析、影响范围、改进措施', defaultTheme: 'amazon', defaultPageCount: 10 },
  { id: 'okr', name: 'OKR/KPI 回顾', icon: '🎯', description: '目标达成、关键结果、下季规划', defaultTheme: 'deloitte', defaultPageCount: 10 },
  { id: 'budget', name: '预算申请', icon: '💰', description: '成本分析、ROI 测算、资源需求', defaultTheme: 'pwc', defaultPageCount: 10 },
  { id: 'vendor', name: '供应商选型', icon: '🏢', description: '方案对比、评分矩阵、推荐方案', defaultTheme: 'brand', defaultPageCount: 15 },
  { id: 'annual', name: '年度总结', icon: '📅', description: '年度成果、数据亮点、来年规划', defaultTheme: 'haio', defaultPageCount: 20 },
  { id: 'product-launch', name: '产品发布', icon: '🚀', description: '产品亮点、市场定位、竞品分析、上市计划', defaultTheme: 'google', defaultPageCount: 15 },
  { id: 'investor-pitch', name: '融资路演', icon: '💎', description: '商业模式、市场规模、团队介绍、财务预测', defaultTheme: 'deloitte', defaultPageCount: 15 },
  { id: 'training', name: '培训课件', icon: '📚', description: '知识讲解、案例分析、实操演练、考核要点', defaultTheme: 'microsoft', defaultPageCount: 20 },
  { id: 'competitive', name: '竞品分析', icon: '⚔️', description: '市场格局、功能对比、SWOT分析、差异化策略', defaultTheme: 'amazon', defaultPageCount: 15 },
  { id: 'data-report', name: '数据分析报告', icon: '📈', description: '数据趋势、关键指标、归因分析、行动建议', defaultTheme: 'pwc', defaultPageCount: 15 },
];
