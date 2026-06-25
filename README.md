<p align="center">
  <img src=<img width="124" height="45" alt="image" src="https://github.com/user-attachments/assets/b4e4560a-2f04-4220-aa03-34fac30a804a" />
 alt="Gammer Logo" width="120" height="120">
</p>

<h1 align="center">Gammer</h1>

<p align="center">
  <strong>AI-Powered Presentation Engine</strong><br>
  从主题到专业 PPTX，AI 研究引擎 + 自动生成
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<img width="2547" height="1387" alt="d4c38f3ff8f82916b5974f259fc27610" src="https://github.com/user-attachments/assets/e512e795-23f0-4251-b702-89600b17c3fe" />

---

## 🌟 Features

### 🧠 AI Research Engine
- **Web Search Integration**: Claude's `web_search` tool for real-time data
- **Multi-query Strategy**: 10+ targeted searches per topic
- **Source Tracking**: Every data point linked to its source
- **Knowledge Fallback**: Model knowledge when web search unavailable

### 📊 Professional PPTX Output
- **16 Layout Types**: metrics-grid, chart-focus, diagram, big-number, etc.
- **13 Theme Styles**: Google, Amazon, Microsoft, Deloitte, PwC, Brand, Haio, etc.
- **Smart Layout Selection**: AI auto-selects best layout for content
- **Visual Rhythm Enforcement**: Prevents 3+ consecutive text-heavy slides

### 🔄 Mermaid Diagram Rendering
- **Flowchart Support**: `graph TD` and `graph LR` syntax
- **Auto-layout**: Dagre-based automatic positioning
- **PPTX Export**: Shapes + text, no image dependencies

### ⚡ Modern Tech Stack
- **Next.js 16** with App Router
- **React 19** with Server Components
- **Zustand** with undo/redo (50 steps)
- **Prisma** with SQLite/PostgreSQL
- **NextAuth v5** for authentication

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key (Claude)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gammer.git
cd gammer

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Build

```bash
npm run build
npm start
```

---

## 🔧 How It Works

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Topic     │───▶│   Outline    │───▶│   Slides    │
│   Input     │    │   Research   │    │   Preview   │
└─────────────┘    └──────────────┘    └─────────────┘
                         │                    │
                         ▼                    ▼
                  ┌──────────────┐    ┌─────────────┐
                  │  Web Search  │    │    PPTX     │
                  │  10 queries  │    │   Export    │
                  └──────────────┘    └─────────────┘
```

### 3-Step Workflow

1. **Topic → Outline**: AI generates structured outline with research
2. **Outline → Slides**: Stream-based slide generation with real-time preview
3. **Slides → PPTX**: Professional PowerPoint export with theme styling

### AI Pipeline

| Phase | Duration | Output |
|-------|----------|--------|
| Research | 30-60s | Key stats, findings, sources |
| Outline | 10-20s | Page titles, bullets, layouts |
| Generation | 60-120s | Full slide content with metrics |
| Quality Check | 5-10s | Visual rhythm, data validation |
| PPTX Build | 5-10s | Binary .pptx file |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_BACKEND` | Yes | `claude` or `gpt` |
| `ANTHROPIC_API_KEY` | Yes* | Claude API key |
| `DATABASE_URL` | Yes | SQLite or PostgreSQL URL |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT |
| `NEXTAUTH_URL` | No | Your app URL (auto-detected) |

\* Only required when `AI_BACKEND=claude` (recommended)

### Theme Customization

Add custom themes in `src/lib/themes.ts`:

```typescript
export const themes: Record<StyleTheme, ThemeConfig> = {
  'my-brand': {
    name: 'My Brand',
    primary: '#1E40AF',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#111827',
    lightGray: '#F3F4F6',
  },
};
```

Add theme design in `src/lib/theme-design.ts`:

```typescript
'my-brand': {
  coverStyle: 'left-block',
  accentPosition: 'left-bar',
  preferredLayouts: ['metrics-grid', 'chart-focus', 'two-column'],
  // ... see theme-design.ts for full options
},
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (research, generate, export)
│   ├── create/             # Main editor page
│   ├── dashboard/          # Project list
│   └── edit/[id]/          # Edit existing project
├── components/
│   ├── SlideRenderer.tsx   # Slide preview component
│   ├── MermaidDiagram.tsx  # Mermaid rendering
│   └── ...
├── lib/
│   ├── ai-generator.ts     # AI slide generation
│   ├── research-engine.ts  # Web search + research
│   ├── pptx-engine.ts      # PowerPoint rendering
│   └── ...
├── store/
│   └── presentation.ts     # Zustand state with undo/redo
└── types/
    └── next-auth.d.ts      # Type extensions
```

---

## 🗺️ Roadmap

### v0.2 (Current)
- [x] AI research engine
- [x] 16 slide layouts
- [x] 13 theme styles
- [x] Mermaid diagram support
- [x] Stream-based preview
- [x] Undo/redo (50 steps)

### v0.3 (Planned)
- [ ] Image generation integration
- [ ] Thumbnail navigation in editor
- [ ] Bullet list editing
- [ ] Export history with re-download

### v0.4 (Future)
- [ ] PostgreSQL support
- [ ] Team collaboration
- [ ] Template gallery
- [ ] PDF export
- [ ] Google Slides export

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) for PowerPoint generation
- [Mermaid](https://mermaid.js.org/) for diagram syntax
- [Zustand](https://zustand-demo.pmnd.rs/) for state management

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/your-username">Your Name</a>
</p>
