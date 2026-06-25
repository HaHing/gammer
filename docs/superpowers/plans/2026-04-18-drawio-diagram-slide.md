# draw.io Diagram Slide Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add draw.io-powered diagram slides to Gammer with multi-mode support, AI generation/editing via a two-tool pattern, and per-slide version control.

**Architecture:** New `DiagramSlide` component wraps draw.io in an iframe with a postMessage bridge; a new `/api/diagram/` route family handles AI generation (two-tool: `display_diagram` + `edit_diagram`); diagram history stored in a new `DiagramVersion` Prisma table. Existing Mermaid slides are unchanged.

**Tech Stack:** Next.js 15 App Router · Prisma SQLite · Vercel AI SDK (`streamText` + tools) · Claude Sonnet 4.6 · draw.io embed API (https://embed.diagrams.net) · Zustand + zundo · Tailwind v4

---

## File Map

### New files
| Path | Responsibility |
|------|---------------|
| `src/components/DiagramSlide.tsx` | draw.io iframe wrapper, postMessage bridge, event callbacks |
| `src/components/DiagramModeSelector.tsx` | Diagram type picker (flowchart / sequence / arch / ER / mind / network / org) |
| `src/components/DiagramVersionPanel.tsx` | History sidebar — list versions, diff preview, restore button |
| `src/app/api/diagram/generate/route.ts` | `POST` — AI full generation via `display_diagram` tool |
| `src/app/api/diagram/edit/route.ts` | `POST` — AI incremental edit via `edit_diagram` tool |
| `src/app/api/diagram/versions/route.ts` | `GET/POST` — fetch / save diagram versions for a slide |
| `src/app/api/diagram/versions/[versionId]/route.ts` | `GET/DELETE` — get / delete a single version |

### Modified files
| Path | Change |
|------|--------|
| `src/lib/types.ts` | Add `drawioXml`, `diagramType`, `diagramMode` fields to `SlideContent`; add `DiagramMode` type |
| `prisma/schema.prisma` | Add `DiagramVersion` model |
| `src/components/SlideRenderer.tsx` | Route `layout === 'diagram' && diagramType === 'drawio'` to `DiagramSlide` |
| `src/app/edit/[id]/page.tsx` | Conditionally render diagram sidebar (mode selector + version panel + AI chat) when active slide is a diagram |
| `src/lib/ai-generator.ts` | Add draw.io XML generation hints to the content system prompt |

---

## Task 1: Extend Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add diagram types**

```typescript
// src/lib/types.ts  — add after existing type SlideLayout line

export type DiagramMode =
  | 'flowchart'
  | 'sequence'
  | 'architecture'
  | 'er'
  | 'mindmap'
  | 'network'
  | 'orgchart';

// In SlideContent interface, add after mermaidCode field:
  drawioXml?: string;          // mxGraph XML for draw.io diagram
  diagramType?: 'mermaid' | 'drawio';  // which renderer
  diagramMode?: DiagramMode;   // template / style hint for AI
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors (or only pre-existing errors unrelated to types.ts).

- [ ] **Step 3: Commit**

```bash
cd /Users/hahing/ClaudeCode/Gammer
git add src/lib/types.ts
git commit -m "feat(types): add drawioXml, diagramType, diagramMode to SlideContent"
```

---

## Task 2: Prisma — DiagramVersion Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add DiagramVersion model**

Append to `prisma/schema.prisma`:

```prisma
model DiagramVersion {
  id         String   @id @default(cuid())
  projectId  String
  slideIndex Int
  xml        String
  label      String?
  createdAt  DateTime @default(now())

  @@index([projectId, slideIndex])
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/hahing/ClaudeCode/Gammer
npx prisma migrate dev --name add_diagram_version
```
Expected: `✔  Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```
Expected: `✔  Generated Prisma Client`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add DiagramVersion model for per-slide history"
```

---

## Task 3: DiagramSlide Component

**Files:**
- Create: `src/components/DiagramSlide.tsx`

The component embeds draw.io via `https://embed.diagrams.net/?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1` and uses `window.postMessage` to load/save XML.

- [ ] **Step 1: Write the component**

```tsx
// src/components/DiagramSlide.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Props {
  xml: string;
  editable?: boolean;
  onSave?: (xml: string) => void;
  className?: string;
}

const DRAWIO_URL =
  'https://embed.diagrams.net/?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&dark=0';

export default function DiagramSlide({ xml, editable = false, onSave, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  // Send XML to draw.io once it signals ready
  const sendLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: 'load', xml, autosave: editable ? 1 : 0 }),
      '*'
    );
  }, [xml, editable]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let msg: { event?: string; xml?: string };
      try { msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }
      catch { return; }

      if (msg.event === 'init') {
        ready.current = true;
        sendLoad();
      } else if (msg.event === 'autosave' || msg.event === 'save') {
        if (msg.xml && onSave) onSave(msg.xml);
      } else if (msg.event === 'load') {
        // diagram fully loaded — no-op
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendLoad, onSave]);

  // Re-send if xml prop changes after initial load
  useEffect(() => {
    if (ready.current) sendLoad();
  }, [sendLoad]);

  return (
    <iframe
      ref={iframeRef}
      src={DRAWIO_URL}
      className={className ?? 'w-full h-full border-0'}
      title="draw.io diagram"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npx tsc --noEmit 2>&1 | head -20
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/DiagramSlide.tsx
git commit -m "feat(component): add DiagramSlide iframe wrapper with postMessage bridge"
```

---

## Task 4: Wire DiagramSlide into SlideRenderer

**Files:**
- Modify: `src/components/SlideRenderer.tsx`

- [ ] **Step 1: Add dynamic import and routing**

In `SlideRenderer.tsx`, after the existing `MermaidDiagram` dynamic import:

```tsx
const DiagramSlide = dynamic(() => import('./DiagramSlide'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 animate-pulse">
      Loading diagram...
    </div>
  ),
});
```

In the `ContentSlide` function (or wherever `layout === 'diagram'` is currently handled), locate the block that renders `MermaidDiagram` and extend it:

```tsx
// Existing check (already in file, find and extend):
if (slide.layout === 'diagram') {
  if (slide.diagramType === 'drawio' && slide.drawioXml) {
    return (
      <div className="w-full h-full">
        <DiagramSlide xml={slide.drawioXml} editable={editable} onSave={xml => onUpdate?.({ ...slide, drawioXml: xml })} />
      </div>
    );
  }
  // fall through to existing Mermaid rendering
}
```

- [ ] **Step 2: Run dev server and verify no runtime errors**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npm run dev 2>&1 | head -30
```
Expected: server starts without errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SlideRenderer.tsx
git commit -m "feat(renderer): route drawio diagram type to DiagramSlide component"
```

---

## Task 5: AI Diagram Generation API

**Files:**
- Create: `src/app/api/diagram/generate/route.ts`

Implements the two-tool pattern from next-ai-draw-io: Claude calls either `display_diagram` (full generation) or describes a refined diagram.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/diagram/generate/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const DIAGRAM_SYSTEM = `You are a diagram expert. When asked to create or describe a diagram, always call the display_diagram tool with valid mxGraph XML.

mxGraph XML format:
<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
  <!-- nodes: -->
  <mxCell id="2" value="Start" style="rounded=1;whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="160" y="40" width="120" height="40" as="geometry"/></mxCell>
  <!-- edges: -->
  <mxCell id="10" edge="1" source="2" target="3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
</root></mxGraphModel>

Diagram mode styles:
- flowchart: rounded rectangles, diamond decisions, directional arrows
- sequence: swimlanes for each actor, horizontal message arrows
- architecture: rectangles for services, cloud shapes for external, grouped by layer
- er: entity rectangles with attribute lists, relation lines with cardinality labels
- mindmap: central oval, branch lines to topic rectangles, sub-branch lines
- network: cylinder shapes for servers, cloud for internet, labeled connections
- orgchart: rectangle hierarchy, top-down edges

Always return complete valid XML. IDs must be unique integers starting from 2 (0 and 1 are reserved).`;

export async function POST(req: Request) {
  const { prompt, mode, currentXml } = await req.json() as {
    prompt: string;
    mode?: string;
    currentXml?: string;
  };

  const userMessage = currentXml
    ? `Current diagram XML:\n${currentXml}\n\nUser request: ${prompt}`
    : `Create a ${mode ?? 'flowchart'} diagram for: ${prompt}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: DIAGRAM_SYSTEM,
    tools: [
      {
        name: 'display_diagram',
        description: 'Render a diagram from mxGraph XML',
        input_schema: {
          type: 'object' as const,
          properties: {
            xml: { type: 'string', description: 'Complete mxGraph XML' },
            title: { type: 'string', description: 'Short diagram title' },
          },
          required: ['xml'],
        },
      },
    ],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'display_diagram') {
      const input = block.input as { xml: string; title?: string };
      return NextResponse.json({ xml: input.xml, title: input.title ?? '' });
    }
  }

  return NextResponse.json({ error: 'No diagram generated' }, { status: 500 });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npx tsc --noEmit 2>&1 | head -20
```
Expected: no new errors.

- [ ] **Step 3: Test the route**

```bash
curl -s -X POST http://localhost:3000/api/diagram/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"用户注册流程","mode":"flowchart"}' | python3 -m json.tool | head -20
```
Expected: JSON with `xml` field containing `<mxGraphModel>`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/diagram/generate/route.ts
git commit -m "feat(api): add /api/diagram/generate with display_diagram tool"
```

---

## Task 6: AI Diagram Edit API

**Files:**
- Create: `src/app/api/diagram/edit/route.ts`

Incremental editing: Claude receives the current XML and a natural language instruction, and returns a patched XML.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/diagram/edit/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const EDIT_SYSTEM = `You are a diagram editor. The user will provide current mxGraph XML and an edit instruction.
Call edit_diagram with the full updated mxGraph XML after applying the edit.
Preserve all existing cell IDs that are not being modified. Only change what the instruction specifies.
Return complete valid XML — never partial fragments.`;

export async function POST(req: Request) {
  const { currentXml, instruction } = await req.json() as {
    currentXml: string;
    instruction: string;
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: EDIT_SYSTEM,
    tools: [
      {
        name: 'edit_diagram',
        description: 'Return the updated full mxGraph XML after applying edits',
        input_schema: {
          type: 'object' as const,
          properties: {
            xml: { type: 'string', description: 'Complete updated mxGraph XML' },
            summary: { type: 'string', description: 'One-line description of changes made' },
          },
          required: ['xml'],
        },
      },
    ],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `Current XML:\n${currentXml}\n\nEdit instruction: ${instruction}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'edit_diagram') {
      const input = block.input as { xml: string; summary?: string };
      return NextResponse.json({ xml: input.xml, summary: input.summary ?? '' });
    }
  }

  return NextResponse.json({ error: 'No edit produced' }, { status: 500 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/diagram/edit/route.ts
git commit -m "feat(api): add /api/diagram/edit with incremental edit_diagram tool"
```

---

## Task 7: Version Control API

**Files:**
- Create: `src/app/api/diagram/versions/route.ts`
- Create: `src/app/api/diagram/versions/[versionId]/route.ts`

- [ ] **Step 1: Write collection route**

```typescript
// src/app/api/diagram/versions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const slideIndex = searchParams.get('slideIndex');

  if (!projectId || slideIndex === null) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const versions = await prisma.diagramVersion.findMany({
    where: { projectId, slideIndex: Number(slideIndex) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, label: true, createdAt: true },
  });

  return NextResponse.json(versions);
}

export async function POST(req: Request) {
  const { projectId, slideIndex, xml, label } = await req.json() as {
    projectId: string;
    slideIndex: number;
    xml: string;
    label?: string;
  };

  const version = await prisma.diagramVersion.create({
    data: { projectId, slideIndex, xml, label },
  });

  // Keep only 50 most recent versions per slide
  const old = await prisma.diagramVersion.findMany({
    where: { projectId, slideIndex },
    orderBy: { createdAt: 'desc' },
    skip: 50,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.diagramVersion.deleteMany({ where: { id: { in: old.map(v => v.id) } } });
  }

  return NextResponse.json(version);
}
```

- [ ] **Step 2: Write single-version route**

```typescript
// src/app/api/diagram/versions/[versionId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { versionId: string } }) {
  const version = await prisma.diagramVersion.findUnique({ where: { id: params.versionId } });
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(version);
}

export async function DELETE(_req: Request, { params }: { params: { versionId: string } }) {
  await prisma.diagramVersion.delete({ where: { id: params.versionId } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify Prisma client has DiagramVersion (migration from Task 2 must be done)**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors on diagramVersion references.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/diagram/versions/
git commit -m "feat(api): add diagram version CRUD endpoints"
```

---

## Task 8: DiagramModeSelector Component

**Files:**
- Create: `src/components/DiagramModeSelector.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/DiagramModeSelector.tsx
'use client';

import type { DiagramMode } from '@/lib/types';

const MODES: { id: DiagramMode; label: string; icon: string; desc: string }[] = [
  { id: 'flowchart',    label: '流程图',   icon: '⬡', desc: '步骤、决策、流程' },
  { id: 'sequence',     label: '时序图',   icon: '↔', desc: '服务间调用顺序' },
  { id: 'architecture', label: '架构图',   icon: '⬜', desc: '系统组件与层次' },
  { id: 'er',           label: 'ER 图',    icon: '⊞', desc: '数据库实体关系' },
  { id: 'mindmap',      label: '思维导图', icon: '✦', desc: '主题与子主题' },
  { id: 'network',      label: '网络拓扑', icon: '⬡', desc: '节点与连接' },
  { id: 'orgchart',     label: '组织架构', icon: '▤', desc: '层级汇报关系' },
];

interface Props {
  value: DiagramMode;
  onChange: (mode: DiagramMode) => void;
}

export default function DiagramModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-xl border" style={{ borderColor: 'var(--border-0)' }}>
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          title={m.desc}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === m.id
              ? 'text-white'
              : 'hover:bg-[var(--bg-2)]'
          }`}
          style={value === m.id ? { background: 'var(--accent)' } : { color: 'var(--text-1)' }}
        >
          <span>{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DiagramModeSelector.tsx
git commit -m "feat(component): add DiagramModeSelector for 7 diagram types"
```

---

## Task 9: DiagramVersionPanel Component

**Files:**
- Create: `src/components/DiagramVersionPanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/DiagramVersionPanel.tsx
'use client';

import { useEffect, useState } from 'react';

interface Version {
  id: string;
  label: string | null;
  createdAt: string;
}

interface Props {
  projectId: string;
  slideIndex: number;
  onRestore: (xml: string) => void;
}

export default function DiagramVersionPanel({ projectId, slideIndex, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/diagram/versions?projectId=${projectId}&slideIndex=${slideIndex}`)
      .then(r => r.json())
      .then(data => { setVersions(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [projectId, slideIndex]);

  const restore = async (versionId: string) => {
    const res = await fetch(`/api/diagram/versions/${versionId}`);
    const data = await res.json();
    if (data.xml) onRestore(data.xml);
  };

  const deleteVersion = async (versionId: string) => {
    await fetch(`/api/diagram/versions/${versionId}`, { method: 'DELETE' });
    setVersions(v => v.filter(x => x.id !== versionId));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
        历史版本 ({versions.length})
      </p>
      {loading && <p className="text-xs" style={{ color: 'var(--text-2)' }}>加载中…</p>}
      {!loading && versions.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>暂无历史版本</p>
      )}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {versions.map((v, i) => (
          <div key={v.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-2)' }}>
            <span style={{ color: 'var(--text-0)' }}>
              {v.label ?? `版本 ${versions.length - i}`}
              <span className="ml-1.5 text-[10px]" style={{ color: 'var(--text-2)' }}>
                {new Date(v.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
            <div className="flex gap-1">
              <button onClick={() => restore(v.id)} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>还原</button>
              <button onClick={() => deleteVersion(v.id)} className="px-1.5 py-0.5 rounded text-[10px]" style={{ color: 'var(--text-2)' }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DiagramVersionPanel.tsx
git commit -m "feat(component): add DiagramVersionPanel with restore/delete"
```

---

## Task 10: Diagram AI Chat Panel (in Edit Page)

**Files:**
- Modify: `src/app/edit/[id]/page.tsx`

Add a collapsible sidebar section that appears when the active slide is a draw.io diagram slide. The panel contains:
1. `DiagramModeSelector`
2. Text input for AI prompt → calls `/api/diagram/generate` or `/api/diagram/edit`
3. `DiagramVersionPanel`

- [ ] **Step 1: Add diagram panel state and save-version helper**

In `EditPage`, after existing state declarations:

```tsx
const [diagramPrompt, setDiagramPrompt] = useState('');
const [diagramLoading, setDiagramLoading] = useState(false);

const saveVersion = useCallback(async (slideIndex: number, xml: string, label?: string) => {
  await fetch('/api/diagram/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: id, slideIndex, xml, label }),
  });
}, [id]);
```

- [ ] **Step 2: Add AI diagram generate/edit handler**

```tsx
const handleDiagramAI = useCallback(async (slideIndex: number, prompt: string) => {
  const slide = slides[slideIndex];
  setDiagramLoading(true);
  try {
    const endpoint = slide.drawioXml ? '/api/diagram/edit' : '/api/diagram/generate';
    const body = slide.drawioXml
      ? { currentXml: slide.drawioXml, instruction: prompt }
      : { prompt, mode: slide.diagramMode ?? 'flowchart' };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.xml) {
      const updated: SlideContent = {
        ...slide,
        diagramType: 'drawio',
        drawioXml: data.xml,
      };
      updateSlide(slideIndex, updated);
      await saveVersion(slideIndex, data.xml, prompt.slice(0, 40));
    }
  } finally {
    setDiagramLoading(false);
    setDiagramPrompt('');
  }
}, [slides, updateSlide, saveVersion]);
```

- [ ] **Step 3: Render diagram panel in sidebar**

In the existing sidebar/card area (after the regular card editor), add:

```tsx
{slides[active]?.layout === 'diagram' && (
  <div className="flex flex-col gap-4 p-4 border-t" style={{ borderColor: 'var(--border-0)' }}>
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-1)' }}>图表设置</p>

    {/* Mode selector */}
    <DiagramModeSelector
      value={(slides[active].diagramMode as DiagramMode) ?? 'flowchart'}
      onChange={mode => updateSlide(active, { ...slides[active], diagramMode: mode, diagramType: 'drawio' })}
    />

    {/* AI prompt */}
    <div className="flex gap-2">
      <input
        className="input flex-1 text-xs px-3 py-2"
        placeholder={slides[active].drawioXml ? '描述修改内容…' : '描述你想要的图表…'}
        value={diagramPrompt}
        onChange={e => setDiagramPrompt(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !diagramLoading && handleDiagramAI(active, diagramPrompt)}
        disabled={diagramLoading}
      />
      <button
        className="btn-primary px-3 py-2 text-xs shrink-0"
        disabled={diagramLoading || !diagramPrompt.trim()}
        onClick={() => handleDiagramAI(active, diagramPrompt)}
      >
        {diagramLoading ? '生成中…' : slides[active].drawioXml ? '优化' : '生成'}
      </button>
    </div>

    {/* Version history */}
    <DiagramVersionPanel
      projectId={id}
      slideIndex={active}
      onRestore={xml => {
        updateSlide(active, { ...slides[active], drawioXml: xml, diagramType: 'drawio' });
      }}
    />
  </div>
)}
```

- [ ] **Step 4: Add imports**

At top of `src/app/edit/[id]/page.tsx`:

```tsx
import DiagramModeSelector from '@/components/DiagramModeSelector';
import DiagramVersionPanel from '@/components/DiagramVersionPanel';
import type { DiagramMode } from '@/lib/types';
```

- [ ] **Step 5: Run dev and verify diagram panel renders for diagram slides**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npm run dev 2>&1 | head -20
```
Open a project in edit mode, select or create a slide with `layout: 'diagram'`. Verify:
- Mode selector shows 7 buttons
- AI prompt input appears
- Version panel shows (empty initially)

- [ ] **Step 6: Commit**

```bash
git add src/app/edit/[id]/page.tsx
git commit -m "feat(editor): add diagram AI chat panel with mode selector and version history"
```

---

## Task 11: Add "New Diagram Slide" button to Editor

**Files:**
- Modify: `src/app/edit/[id]/page.tsx`

Users need a way to add a new draw.io diagram slide without going through the AI generator.

- [ ] **Step 1: Add handler**

In `EditPage`, add a function to insert a blank diagram slide:

```tsx
const addDiagramSlide = useCallback(() => {
  const newSlide: SlideContent = {
    type: 'architecture',
    layout: 'diagram',
    title: '新建图表',
    diagramType: 'drawio',
    diagramMode: 'flowchart',
    drawioXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>',
  };
  const next = [...slides, newSlide];
  setSlides(next);
  setActive(next.length - 1);
  autoSave(next);
}, [slides, autoSave]);
```

- [ ] **Step 2: Add button in the slide list toolbar**

Find the existing "+ add slide" or toolbar area and add:

```tsx
<button onClick={addDiagramSlide} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
  <span>⬡</span> 新建图表
</button>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/edit/[id]/page.tsx
git commit -m "feat(editor): add 'New Diagram Slide' button"
```

---

## Task 12: Integration Smoke Test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/hahing/ClaudeCode/Gammer && npm run dev
```

- [ ] **Step 2: Verify checklist**

Navigate to `http://localhost:3000` and go through an existing project in edit mode.

- [ ] Nav to edit page, find or create a diagram-layout slide
- [ ] Diagram panel appears in sidebar with mode selector
- [ ] Select "架构图" mode — mode selector highlights it
- [ ] Type a prompt ("画一个三层Web架构"), click "生成" — after ~5s, draw.io iframe loads with generated XML
- [ ] Click inside the iframe and move a node — the `autosave` event triggers `onSave`, `updateSlide` fires
- [ ] Check version panel — 1 version appears
- [ ] Type "把数据库层改成两个节点", click "优化" — diagram updates
- [ ] Version panel now shows 2 versions; click "还原" on first version — diagram reverts
- [ ] Click "+ 新建图表" button — blank diagram slide is appended and selected
- [ ] Open `/create` page to confirm AI-generated slides still work (Mermaid / non-diagram slides unaffected)

- [ ] **Step 3: Final commit**

```bash
cd /Users/hahing/ClaudeCode/Gammer
git add -A
git commit -m "chore: integration verified — draw.io diagram slides working end-to-end"
```

---

## Known Limitations & Future Work

- draw.io iframe requires internet access (loads from `embed.diagrams.net`)
- For offline/self-hosted use, replace `DRAWIO_URL` with a self-hosted draw.io instance
- PPTX export (`pptxgenjs`) does not yet handle draw.io XML — export renders a placeholder. Future: screenshot iframe via Puppeteer
- Version labels are auto-set to the prompt text; future: allow user to rename versions inline
- Mermaid → draw.io migration path: a future task could add a "Convert to draw.io" button for existing Mermaid slides
