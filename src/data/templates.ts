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
];
