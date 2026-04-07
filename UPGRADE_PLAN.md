# Gammer 重大升级计划

## Context
用户反馈当前 MVP 存在三大核心问题：
1. **无配图** — PPTX 全是文字，缺乏视觉表现力
2. **内容质量一般** — 没有真实权威数据支撑，不够细节
3. **模板化严重** — 没有结合主题动态调整设计，专业度不足

目标：超越 Gamma.app，做到"落地、清晰、专业"。

---

## 升级模块

### 模块 1：AI 配图系统（image-generator.ts）
**问题**：当前 image-generator.ts 已有框架但需要配置 Google API 环境变量才能工作。
**方案**：
- 创建 `.env.local` 配置 GOOGLE_API_KEY / GOOGLE_BASE_URL / GOOGLE_MODEL
- 优化 image prompt 生成逻辑 — 根据每页具体内容（而非泛泛的类型）生成精准的图片描述
- 增加图片与主题的关联度：将 slide 的 bullets/data/insight 融入 prompt
- 并发控制：批量生成时限制并发数，避免 API 限流

**文件**：`src/lib/image-generator.ts`, `.env.local`

### 模块 2：权威数据研究引擎（新建 research-engine.ts）
**问题**：当前 AI 生成内容全靠 LLM 编造数据，没有真实来源。
**方案**：
- 新建 `src/lib/research-engine.ts` — 在生成内容前，先用 web search 收集权威数据
- 流程：用户输入主题 → 拆解为 5-8 个搜索查询 → 并发搜索 20+ 来源 → 提取关键数据/统计/趋势 → 整理为结构化研究报告 → 注入 AI prompt
- 搜索策略：针对主题生成多维度查询（市场规模、技术趋势、竞品分析、行业报告、最佳实践等）
- 数据提取：从搜索结果中提取数字、百分比、排名、趋势等结构化数据
- 来源标注：每条数据保留出处，最终在 PPTX 中标注数据来源

**文件**：新建 `src/lib/research-engine.ts`

### 模块 3：AI 内容生成升级（ai-generator.ts）
**问题**：当前 prompt 虽然详细但缺乏真实数据注入，生成内容空洞。
**方案**：
- 将 research-engine 的研究结果注入 system prompt 和 user prompt
- 强化 prompt：要求 AI 必须引用研究报告中的真实数据，不得编造
- 增加内容与主题的深度绑定：根据场景标签动态调整内容框架
- 增加 keyMetrics 和 insight 的渲染到 PPTX 中（当前 types.ts 已定义但 pptx-engine 未渲染）

**文件**：`src/lib/ai-generator.ts`

### 模块 4：PPTX 渲染引擎升级（pptx-engine.ts）
**问题**：当前渲染过于模板化，缺乏动态设计。
**方案**：
- 渲染 keyMetrics：在内容页/数据页/总结页添加醒目的数字卡片区域
- 渲染 insight：在每页添加高亮色块的核心结论
- 渲染 source：在数据页底部添加数据来源脚注
- 图片布局优化：根据有无图片动态调整文字区域
- 内容页增加 subtitle 作为 insight callout box（部分已实现，需完善）
- 数据页增加 keyMetrics 大数字展示区

**文件**：`src/lib/pptx-engine.ts`

### 模块 5：预览 API 流程升级
**问题**：需要串联 research → AI content → image gen 的完整流程。
**方案**：
- preview route: research → inject data → AI generate → image gen → quality check → return
- generate route: 支持从 preview 传入已生成的内容和图片，避免重复调用

**文件**：`src/app/api/preview/route.ts`, `src/app/api/generate/route.ts`

---

## 实施顺序

1. 创建 `.env.local` 配置所有 API keys
2. 新建 `research-engine.ts` — 权威数据研究引擎
3. 升级 `ai-generator.ts` — 注入研究数据
4. 升级 `image-generator.ts` — 优化 prompt 精准度
5. 升级 `pptx-engine.ts` — 渲染 keyMetrics/insight/source/图片
6. 升级 API routes — 串联完整流程
7. 构建验证 + 端到端测试

## 验证方式
1. `npm run build` 无报错
2. 启动 dev server，输入主题"2024年中国云计算市场分析"
3. 点击预览 → 检查：内容是否包含真实数据来源、是否有配图、keyMetrics 是否展示
4. 下载 PPTX → 打开检查：配图是否嵌入、数字卡片是否渲染、数据来源是否标注
