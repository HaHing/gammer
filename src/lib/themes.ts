import { ThemeConfig, StyleTheme } from './types';

/**
 * 商务风色彩规范：每种风格 1主色 + 3辅助色
 * 主色：标题、强调、图表主色
 * secondary：信息层级（副标题、次要文字）
 * accent：重点提示（关键数据、CTA）
 * lightGray：背景分层、卡片底色
 */
export const themes: Record<StyleTheme, ThemeConfig> = {
  google: {
    name: '经典蓝',
    primary: '#1A3C6E',     // 深藏青 — 标题/图表主色
    secondary: '#5A6B7F',   // 中性灰蓝 — 副标题/次要信息
    accent: '#2E7DB5',      // 青蓝 — 重点提示/强调
    background: '#FFFFFF',
    text: '#1F2937',        // 正文深灰
    lightGray: '#F4F6F8',   // 浅灰 — 背景分层
    description: '权威·专业·数据驱动',
  },
  amazon: {
    name: '商务藏青',
    primary: '#1B2A4A',     // 藏青 — 标题
    secondary: '#6B7280',   // 中性灰 — 信息层级
    accent: '#C8963E',      // 低饱和金 — 重点提示
    background: '#FFFFFF',
    text: '#1F2937',
    lightGray: '#F5F6F7',
    description: '高密度·叙事性·信息导向',
  },
  microsoft: {
    name: '专业蓝灰',
    primary: '#1E3A5F',     // 深蓝 — 标题
    secondary: '#6E7B8B',   // 蓝灰 — 信息层级
    accent: '#3B82B0',      // 中蓝 — 强调
    background: '#FFFFFF',
    text: '#1F2937',
    lightGray: '#F3F5F7',
    description: '结构清晰·蓝灰色调·专业',
  },
  deloitte: {
    name: '咨询绿',
    primary: '#1A3C34',     // 深墨绿 — 标题
    secondary: '#5A6B63',   // 灰绿 — 信息层级
    accent: '#5B8C3E',      // 低饱和绿 — 强调
    background: '#FFFFFF',
    text: '#1F2937',
    lightGray: '#F4F6F4',
    description: '严谨·规范·数据图表',
  },
  pwc: {
    name: '暖色商务',
    primary: '#4A2C1A',     // 深棕 — 标题
    secondary: '#7B6B5D',   // 暖灰 — 信息层级
    accent: '#B8860B',      // 暗金 — 强调
    background: '#FFFFFF',
    text: '#1F2937',
    lightGray: '#F7F5F3',
    description: '暖色调·结构化·高可信度',
  },
  brand: {
    name: '品牌定制',
    primary: '#2D1B69',     // 深紫 — 标题
    secondary: '#6B6B8D',   // 灰紫 — 信息层级
    accent: '#6C5CE7',      // 中紫 — 强调
    background: '#FFFFFF',
    text: '#1F2937',
    lightGray: '#F5F3FA',
    description: '品牌色·科技感·定制',
  },
  haio: {
    name: '极简深蓝',
    primary: '#0F2B46',     // 极深蓝 — 标题
    secondary: '#5C6B7A',   // 冷灰 — 信息层级
    accent: '#2A7AB5',      // 青蓝 — 强调
    background: '#FAFBFC',
    text: '#1F2937',
    lightGray: '#F1F4F7',
    description: '极简·深色封面·高端商务',
  },
  'tech-blue': {
    name: '科技蓝',
    primary: '#1B3A6B',
    secondary: '#5A7394',
    accent: '#00B4D8',
    background: '#FFFFFF',
    text: '#1E2A3A',
    lightGray: '#F0F5FA',
    description: '科技蓝·云服务·现代感',
  },
  'tech-teal': {
    name: '科技青绿',
    primary: '#0D4F5C',
    secondary: '#5B8A94',
    accent: '#00C9A7',
    background: '#FFFFFF',
    text: '#1A2E35',
    lightGray: '#EFF7F5',
    description: '青绿色调·数据智能·清新',
  },
  'tech-dark': {
    name: '深邃蓝',
    primary: '#0A1E3D',
    secondary: '#4A6580',
    accent: '#2E9BDB',
    background: '#FAFCFE',
    text: '#0F1B2D',
    lightGray: '#EDF2F7',
    description: '深邃蓝·高端商务·稳重',
  },
  'tech-gradient': {
    name: '蓝绿渐变',
    primary: '#1A4B8C',
    secondary: '#6B8CAE',
    accent: '#00D4AA',
    background: '#FFFFFF',
    text: '#1C2D3F',
    lightGray: '#F2F8F6',
    description: '蓝绿渐变·云原生·活力',
  },
  'tech-warm': {
    name: '暖蓝橙',
    primary: '#2C4A7C',
    secondary: '#7A8FA5',
    accent: '#E8963C',
    background: '#FFFFFF',
    text: '#1F2D3D',
    lightGray: '#F5F3F0',
    description: '暖蓝橙·企业服务·亲和',
  },
  'brand-red': {
    name: '品牌红',
    primary: '#D3013C',
    secondary: '#767474',
    accent: '#D3013C',
    background: '#FFFFFF',
    text: '#1E1E1E',
    lightGray: '#F2F2F2',
    description: '企业红·热情·活力',
  },
};
