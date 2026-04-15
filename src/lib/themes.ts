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
  anchnet: {
    name: '安畅科技蓝',
    primary: '#1B3A6B',     // 安畅深蓝 — 标题/导航
    secondary: '#5A7394',   // 蓝灰 — 信息层级
    accent: '#00B4D8',      // 安畅青蓝 — CTA/强调
    background: '#FFFFFF',
    text: '#1E2A3A',
    lightGray: '#F0F5FA',
    description: '安畅官网·科技蓝·云服务',
  },
  'anchnet-teal': {
    name: '安畅青绿',
    primary: '#0D4F5C',     // 深青绿 — 标题
    secondary: '#5B8A94',   // 青灰 — 信息层级
    accent: '#00C9A7',      // 翠绿 — 强调
    background: '#FFFFFF',
    text: '#1A2E35',
    lightGray: '#EFF7F5',
    description: '安畅·青绿色调·数据智能',
  },
  'anchnet-dark': {
    name: '安畅深邃',
    primary: '#0A1E3D',     // 极深藏青 — 标题
    secondary: '#4A6580',   // 冷蓝灰 — 信息层级
    accent: '#2E9BDB',      // 亮蓝 — 强调
    background: '#FAFCFE',
    text: '#0F1B2D',
    lightGray: '#EDF2F7',
    description: '安畅·深邃蓝·高端商务',
  },
  'anchnet-gradient': {
    name: '安畅渐变',
    primary: '#1A4B8C',     // 渐变蓝起点 — 标题
    secondary: '#6B8CAE',   // 中蓝灰 — 信息层级
    accent: '#00D4AA',      // 渐变绿终点 — 强调
    background: '#FFFFFF',
    text: '#1C2D3F',
    lightGray: '#F2F8F6',
    description: '安畅·蓝绿渐变·云原生',
  },
  'anchnet-warm': {
    name: '安畅暖蓝',
    primary: '#2C4A7C',     // 暖蓝 — 标题
    secondary: '#7A8FA5',   // 暖灰蓝 — 信息层级
    accent: '#E8963C',      // 暖橙 — 强调
    background: '#FFFFFF',
    text: '#1F2D3D',
    lightGray: '#F5F3F0',
    description: '安畅·暖蓝橙·企业服务',
  },
};
