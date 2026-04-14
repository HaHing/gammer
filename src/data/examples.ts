export interface Example {
  id: string;
  title: string;
  scene: string;
  theme: string;
  pages: number;
  description: string;
}

export const examples: Example[] = [
  { id: 'ex-1', title: '2026 Q1 技术架构升级方案', scene: '技术方案评审', theme: 'google', pages: 15, description: '微服务架构迁移方案，含性能基准和成本分析' },
  { id: 'ex-2', title: 'AI Agent 平台选型报告', scene: '供应商选型', theme: 'brand', pages: 12, description: '8 大 Agent 平台统一维度对比评估' },
  { id: 'ex-3', title: '2025 年度技术团队总结', scene: '年度总结', theme: 'haio', pages: 20, description: '团队成果、技术债务清理、人才发展' },
  { id: 'ex-4', title: 'P0 故障复盘：支付系统超时', scene: '故障复盘', theme: 'amazon', pages: 10, description: '根因分析、时间线还原、5-Why 分析' },
  { id: 'ex-5', title: 'Q2 OKR 回顾与 Q3 规划', scene: 'OKR/KPI 回顾', theme: 'deloitte', pages: 10, description: '目标达成率、关键结果分析、下季度 OKR' },
  { id: 'ex-6', title: 'GPU 集群扩容预算申请', scene: '预算申请', theme: 'pwc', pages: 10, description: 'ROI 测算、TCO 分析、分阶段投入计划' },
];
