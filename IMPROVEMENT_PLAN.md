# Gammer PPTX 质量提升计划

## 问题诊断

### 问题1: 没有配图
- `image-generator.ts` 已存在，使用 Google Gemini API
- 需要确认 API 调用格式是否匹配 `nano-banana-pro` 模型（可能需要调整 endpoint/auth 格式）
- 当前并发限制为 2 张/批，最多 8 张 — 合理

### 问题2: 全是文字，内容质量一般
- AI 生成了 `keyMetrics`、`insight`、`source` 字段，但 **pptx-engine.ts 完全没有渲染这些字段**
- `renderContent()` 只渲染 title + subtitle + bullets — 缺少指标卡片、核心洞察色块、数据来源脚注
- `renderData()` 只有图表 + bullets — 缺少 KPI 卡片区域
- `renderSummary()` 同样缺少结构化展示

### 问题3: PPTX 全是套模板，没有结合主题调整
- 所有版式渲染器使用固定坐标和固定布局
- 没有根据内容量动态调整布局（比如有图片时重排、有 keyMetrics 时分区）
- 缺少视觉层次：没有色块分区、没有数字高亮卡片、没有 insight 醒目展示

## 改进方案

### 1. 修复图片生成 (`image-generator.ts`)
- 调整 API 调用以匹配 `GOOGLE_BASE_URL` + `GOOGLE_API_KEY` + `nano-banana-pro` 模型
- 确保 Authorization header 格式正确
- 添加调试日志

### 2. 增强 PPTX 渲染引擎 (`pptx-engine.ts`) — 核心改动
为每种版式添加：

#### a) KeyMetrics 卡片区域
- 在内容页顶部或右侧渲染 2-4 个指标卡片
- 大号数字 + 小号标签 + 趋势箭头
- 使用主题色背景色块

#### b) Insight 醒目色块
- 在 subtitle 位置或页面底部渲染一个带主题色左边框的 insight 色块
- 区别于普通 bullet，视觉上更突出

#### c) Source 脚注
- 数据页底部添加数据来源标注
- 小字体、灰色、靠左对齐

#### d) 动态布局
- 有 keyMetrics 时：上方卡片区 + 下方 bullets
- 有图片时：左文右图 or 上图下文
- 有 insight 时：底部醒目色块

### 3. 各版式具体改进

#### renderContent — 内容页
当前: title → subtitle → bullets
改进: title → insight色块 → keyMetrics卡片(2-4个) → bullets → 图片(如有)

#### renderData — 数据页  
当前: title → subtitle → chart → bullets
改进: title → keyMetrics卡片 → chart + insight → bullets → source脚注

#### renderComparison — 对比页
当前: 双栏 bullets
改进: 双栏 + 顶部 keyMetrics 对比卡片 + insight 结论

#### renderTimeline — 时间线页
当前: 水平时间线 + 文字
改进: 时间线 + keyMetrics里程碑数字 + insight

#### renderSummary — 总结页
当前: 彩色标题栏 + 交替背景 bullets
改进: 标题栏 + keyMetrics成果卡片 + bullets + insight行动号召

#### renderCover — 封面页
当前: 标题 + 副标题 + 日期
改进: 标题 + 副标题 + keyMetrics核心数字(2-3个) + 图片

## 文件改动清单
1. `src/lib/pptx-engine.ts` — 主要改动，增强所有渲染器
2. `src/lib/image-generator.ts` — 修复 API 调用格式
3. `src/lib/types.ts` — 无需改动（已有 keyMetrics/insight/source）

## 验证方式
1. 启动 dev server，设置环境变量
2. 生成一份 10 页 PPTX
3. 检查：每页是否有指标卡片、insight 色块、数据来源
4. 检查：是否有配图
5. 检查：视觉层次是否丰富（不再是纯文字列表）
