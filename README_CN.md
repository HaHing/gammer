<p align="center">
  <img src="public/globe.svg" alt="Gammer Logo" width="120" height="120">
</p>

<h1 align="center">Gammer</h1>

<p align="center">
  <strong>AI 驱动的演示文稿引擎</strong><br>
  从主题到专业 PPTX，AI 研究引擎 + 自动生成
</p>

<p align="center">
  <a href="#-特性">特性</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-工作原理">工作原理</a> •
  <a href="#-配置">配置</a> •
  <a href="#-路线图">路线图</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 🌟 特性

### 🧠 AI 研究引擎
- **网络搜索集成**：使用 Claude 的 `web_search` 工具获取实时数据
- **多查询策略**：每个主题执行 10+ 次精准搜索
- **来源追踪**：每个数据点都链接到原始来源
- **知识库回退**：网络搜索不可用时使用模型知识

### 📊 专业 PPTX 输出
- **16 种布局类型**：metrics-grid、chart-focus、diagram、big-number 等
- **13 种主题风格**：Google、Amazon、Microsoft、Deloitte、PwC、Brand 等
- **智能布局选择**：AI 自动选择最适合内容的布局
- **视觉节奏强制执行**：避免 3 页以上连续文字密集幻灯片

### 🔄 Mermaid 图表渲染
- **流程图支持**：`graph TD` 和 `graph LR` 语法
- **自动布局**：基于 Dagre 的自动定位
- **PPTX 导出**：形状 + 文本，无需图片依赖

### ⚡ 现代技术栈
- **Next.js 16** App Router
- **React 19** 服务端组件
- **Zustand** 支持撤销/重做（50 步）
- **Prisma** 支持 SQLite/PostgreSQL
- **NextAuth v5** 身份认证

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Anthropic API 密钥（Claude）

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/gammer.git
cd gammer

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 ANTHROPIC_API_KEY

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

```bash
npm run build
npm start
```

---

## 🔧 工作原理

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   主题      │───▶│   大纲       │───▶│   幻灯片    │
│   输入      │    │   研究       │    │   预览      │
└─────────────┘    └──────────────┘    └─────────────┘
                         │                    │
                         ▼                    ▼
                  ┌──────────────┐    ┌─────────────┐
                  │  网络搜索    │    │    PPTX     │
                  │  10次查询    │    │   导出      │
                  └──────────────┘    └─────────────┘
```

### 三步工作流

1. **主题 → 大纲**：AI 生成带研究数据的结构化大纲
2. **大纲 → 幻灯片**：流式生成，实时预览
3. **幻灯片 → PPTX**：专业 PowerPoint 导出，带主题样式

### AI 管道

| 阶段 | 耗时 | 输出 |
|------|------|------|
| 研究 | 30-60秒 | 关键指标、发现、来源 |
| 大纲 | 10-20秒 | 页面标题、要点、布局 |
| 生成 | 60-120秒 | 完整幻灯片内容含指标 |
| 质量检查 | 5-10秒 | 视觉节奏、数据验证 |
| PPTX 构建 | 5-10秒 | 二进制 .pptx 文件 |

---

## ⚙️ 配置

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `AI_BACKEND` | 是 | `claude` 或 `gpt` |
| `ANTHROPIC_API_KEY` | 是* | Claude API 密钥 |
| `DATABASE_URL` | 是 | SQLite 或 PostgreSQL URL |
| `NEXTAUTH_SECRET` | 是 | JWT 随机字符串 |
| `NEXTAUTH_URL` | 否 | 应用 URL（自动检测） |

\* 仅当 `AI_BACKEND=claude` 时必填（推荐）

### 主题自定义

在 `src/lib/themes.ts` 中添加自定义主题：

```typescript
export const themes: Record<StyleTheme, ThemeConfig> = {
  'my-brand': {
    name: '我的品牌',
    primary: '#1E40AF',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#111827',
    lightGray: '#F3F4F6',
  },
};
```

在 `src/lib/theme-design.ts` 中添加主题设计：

```typescript
'my-brand': {
  coverStyle: 'left-block',
  accentPosition: 'left-bar',
  preferredLayouts: ['metrics-grid', 'chart-focus', 'two-column'],
  // ... 完整选项见 theme-design.ts
},
```

---

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由（研究、生成、导出）
│   ├── create/             # 主编辑器页面
│   ├── dashboard/          # 项目列表
│   └── edit/[id]/          # 编辑已有项目
├── components/
│   ├── SlideRenderer.tsx   # 幻灯片预览组件
│   ├── MermaidDiagram.tsx  # Mermaid 渲染
│   └── ...
├── lib/
│   ├── ai-generator.ts     # AI 幻灯片生成
│   ├── research-engine.ts  # 网络搜索 + 研究
│   ├── pptx-engine.ts      # PowerPoint 渲染
│   └── ...
├── store/
│   └── presentation.ts     # Zustand 状态管理（含撤销/重做）
└── types/
    └── next-auth.d.ts      # 类型扩展
```

---

## 🗺️ 路线图

### v0.2（当前版本）
- [x] AI 研究引擎
- [x] 16 种幻灯片布局
- [x] 13 种主题风格
- [x] Mermaid 图表支持
- [x] 流式预览
- [x] 撤销/重做（50 步）

### v0.3（计划中）
- [ ] 图片生成集成
- [ ] 编辑器缩略图导航
- [ ] Bullet 列表编辑
- [ ] 导出历史记录

### v0.4（未来）
- [ ] PostgreSQL 支持
- [ ] 团队协作
- [ ] 模板库
- [ ] PDF 导出
- [ ] Google Slides 导出

---

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Anthropic](https://www.anthropic.com/) 提供 Claude API
- [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) 提供 PowerPoint 生成
- [Mermaid](https://mermaid.js.org/) 提供图表语法
- [Zustand](https://zustand-demo.pmnd.rs/) 提供状态管理

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/your-username">Your Name</a>
</p>
