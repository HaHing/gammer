'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SlideContent, StyleTheme, ThemeConfig, DiagramMode } from '@/lib/types';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';
import DiagramModeSelector from '@/components/DiagramModeSelector';
import DiagramVersionPanel from '@/components/DiagramVersionPanel';
import UserMenuFab from '@/components/UserMenuFab';

interface ProjectData {
  id: string;
  title: string;
  theme: string;
  paletteIdx: number;
  slides: SlideContent[] | null;
  outline: unknown;
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'slide' | 'card'>('slide');
  const [diagramPrompt, setDiagramPrompt] = useState('');
  const [diagramLoading, setDiagramLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => {
      if (!r.ok) { setError('项目不存在或无权限'); return; }
      return r.json();
    }).then(d => {
      if (d) { setProject(d); setSlides(d.slides || []); }
    }).catch(() => setError('加载失败'));
  }, [id]);

  const autoSave = useCallback((newSlides: SlideContent[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: newSlides }),
      });
      setSaving(false);
    }, 3000);
  }, [id]);

  const updateSlide = useCallback((i: number, slide: SlideContent) => {
    setSlides(prev => {
      const next = [...prev];
      next[i] = slide;
      autoSave(next);
      return next;
    });
  }, [autoSave]);

  const saveVersion = useCallback(async (slideIndex: number, xml: string, label?: string) => {
    await fetch('/api/diagram/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, slideIndex, xml, label }),
    });
  }, [id]);

  const handleDiagramAI = useCallback(async (slideIndex: number, prompt: string) => {
    const slide = slides[slideIndex];
    if (!slide) return;
    setDiagramLoading(true);
    const endpoint = slide.drawioXml ? '/api/diagram/edit' : '/api/diagram/generate';
    const body = slide.drawioXml
      ? { currentXml: slide.drawioXml, instruction: prompt }
      : { prompt, mode: slide.diagramMode ?? 'flowchart' };

    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.xml) {
        const updated: SlideContent = {
          ...slide,
          diagramType: 'drawio',
          drawioXml: data.xml,
          ...(data.bullets?.length ? { bullets: data.bullets } : {}),
          ...(data.title ? { title: data.title } : {}),
        };
        setSlides(prev => {
          const next = [...prev];
          next[slideIndex] = updated;
          autoSave(next);
          return next;
        });
        saveVersion(slideIndex, data.xml, prompt.slice(0, 40));
      }
    } finally {
      setDiagramLoading(false);
      setDiagramPrompt('');
    }
  }, [slides, autoSave, saveVersion]);

  const addDiagramSlide = useCallback(() => {
    const newSlide: SlideContent = {
      type: 'architecture',
      layout: 'diagram',
      title: '新建图表',
      diagramType: 'drawio',
      diagramMode: 'architecture',
      drawioXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>',
    };
    setSlides(prev => {
      const next = [...prev, newSlide];
      autoSave(next);
      setTimeout(() => setActive(next.length - 1), 0);
      return next;
    });
  }, [autoSave]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0, #ffffff)', color: 'var(--text-0, #1e1e1e)' }}>
      <div className="text-center">
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-2, #222)' }}>返回</button>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0, #ffffff)', color: 'var(--text-2, #666)' }}>
      加载中...
    </div>
  );

  const themeKey = (project.theme || 'brand') as StyleTheme;
  const themeConfig: ThemeConfig = themes[themeKey] || themes.brand;
  const activeSlide = slides[active];
  const isDiagramSlide = activeSlide?.layout === 'diagram';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0, #ffffff)', color: 'var(--text-0, #1e1e1e)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border-0, #222)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-sm hover:opacity-80" style={{ color: 'var(--text-2, #666)' }}>← 返回</button>
          <span className="text-sm font-medium">{project.title}</span>
          {saving && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2, #222)', color: 'var(--text-2, #666)' }}>保存中...</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-0, #ddd)' }}>
            <button onClick={() => setViewMode('slide')} className="text-[11px] px-2.5 py-1" style={{ background: viewMode === 'slide' ? 'var(--bg-2, #eee)' : 'transparent', color: 'var(--text-1, #333)' }}>Slide</button>
            <button onClick={() => setViewMode('card')} className="text-[11px] px-2.5 py-1" style={{ background: viewMode === 'card' ? 'var(--bg-2, #eee)' : 'transparent', color: 'var(--text-1, #333)' }}>Card</button>
          </div>
          <button onClick={() => router.push(`/present/${id}`)} className="text-sm px-3 py-1.5 rounded-lg hover:opacity-80" style={{ background: 'var(--bg-2, #eee)', color: 'var(--text-0, #1e1e1e)' }}>▶ 演示</button>
          <span className="text-[10px]" style={{ color: 'var(--text-2, #666)' }}>{slides.length} 页</span>
          <div className="w-[1px] h-6 mx-1" style={{ background: 'var(--border-0, #ddd)' }} />
          <UserMenuFab />
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 49px)' }}>
        {/* Thumbnail Nav */}
        <div className="w-48 flex flex-col border-r shrink-0" style={{ borderColor: 'var(--border-0, #222)', background: 'var(--bg-1, #111)' }}>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((s, i) => (
            <div key={i} onClick={() => setActive(i)}
              className={`cursor-pointer rounded-lg overflow-hidden transition-all ${active === i ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-gray-600'}`}>
              <div className="text-[8px] px-1.5 py-0.5 flex justify-between" style={{ background: 'var(--bg-2, #1a1a1a)', color: 'var(--text-2, #666)' }}>
                <span>{i + 1}</span>
                <span className="truncate ml-1">{s.title?.slice(0, 12)}</span>
              </div>
              <div className="pointer-events-none overflow-hidden" style={{ width: 100, height: 56.25 }}>
                <div className="scale-[0.25] origin-top-left" style={{ width: 400, height: 225 }}>
                  <SlideRenderer slide={s} theme={themeConfig} themeKey={themeKey} pageNum={i + 1} total={slides.length} />
                </div>
              </div>
            </div>
          ))}
          </div>
          {/* 新建图表按钮 — 固定在左侧栏底部 */}
          <div className="p-2 border-t" style={{ borderColor: 'var(--border-0, #2a2a2a)' }}>
            <button onClick={addDiagramSlide}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <span className="text-sm">⬡</span> 新建图表
            </button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[900px] mx-auto space-y-6">
            {viewMode === 'slide' ? slides.map((s, i) => (
              <div key={i} id={`slide-${i}`} className={`transition-all ${active === i ? 'ring-2 ring-purple-500 rounded-xl' : ''}`}
                onClick={() => setActive(i)}>
                <SlideRenderer slide={s} theme={themeConfig} themeKey={themeKey} pageNum={i + 1} total={slides.length}
                  editable onUpdate={(updated) => updateSlide(i, updated)} />
              </div>
            )) : slides.map((s, i) => (
              <CardEditor key={i} slide={s} index={i} active={active === i} onSelect={() => setActive(i)} onUpdate={(updated) => updateSlide(i, updated)} />
            ))}
          </div>
        </div>

        {/* Diagram Panel — appears when active slide is a diagram */}
        {isDiagramSlide && (
          <div className="w-72 shrink-0 overflow-y-auto border-l p-4 space-y-4" style={{ borderColor: 'var(--border-0, #222)', background: 'var(--bg-1, #f9fafb)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-1)' }}>图表设置</p>

            {/* Mode selector */}
            <DiagramModeSelector
              value={(activeSlide.diagramMode as DiagramMode) ?? 'flowchart'}
              onChange={mode => updateSlide(active, { ...activeSlide, diagramMode: mode, diagramType: 'drawio' })}
            />

            {/* AI prompt */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>AI 生成/优化</p>
              <textarea
                className="input text-xs px-3 py-2 resize-none"
                rows={3}
                placeholder={activeSlide.drawioXml ? '描述修改内容，例如：把第一步拆成两个步骤' : '描述你想要的图表，例如：用户注册流程'}
                value={diagramPrompt}
                onChange={e => setDiagramPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !diagramLoading && diagramPrompt.trim()) {
                    handleDiagramAI(active, diagramPrompt);
                  }
                }}
                disabled={diagramLoading}
              />
              <button
                className="btn-primary text-xs px-4 py-2 w-full"
                disabled={diagramLoading || !diagramPrompt.trim()}
                onClick={() => handleDiagramAI(active, diagramPrompt)}
              >
                {diagramLoading ? '生成中…' : activeSlide.drawioXml ? '⬡ 优化图表' : '⬡ 生成图表'}
              </button>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--border-0)' }}>
              <DiagramVersionPanel
                projectId={id}
                slideIndex={active}
                onRestore={xml => updateSlide(active, { ...activeSlide, drawioXml: xml, diagramType: 'drawio' })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CardEditor({ slide, index, active, onSelect, onUpdate }: {
  slide: SlideContent; index: number; active: boolean; onSelect: () => void; onUpdate: (s: SlideContent) => void;
}) {
  const LAYOUTS: SlideContent['layout'][] = ['full-text', 'two-column', 'three-column', 'big-number', 'chart-focus', 'table-focus', 'icon-grid', 'process-flow', 'quote-highlight', 'metrics-grid', 'funnel', 'pyramid', 'problem-solution', 'highlight', 'diagram'];
  return (
    <div onClick={onSelect} className={`rounded-xl p-4 space-y-3 transition-all ${active ? 'ring-2 ring-purple-500' : ''}`}
      style={{ background: 'var(--bg-0, #fff)', border: '1px solid var(--border-0, #e5e7eb)' }}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold w-6 h-6 rounded flex items-center justify-center text-white bg-purple-500">{index + 1}</span>
        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #666)' }}>{slide.type}</span>
        <select value={slide.layout || 'full-text'} onChange={e => onUpdate({ ...slide, layout: e.target.value as SlideContent['layout'] })}
          className="text-[10px] px-2 py-0.5 rounded outline-none" style={{ background: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #666)' }}>
          {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <input value={slide.title} onChange={e => onUpdate({ ...slide, title: e.target.value })}
        className="w-full text-[14px] font-semibold px-3 py-1.5 rounded-lg outline-none"
        style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)' }} placeholder="标题" />
      {slide.subtitle !== undefined && (
        <input value={slide.subtitle || ''} onChange={e => onUpdate({ ...slide, subtitle: e.target.value })}
          className="w-full text-[12px] px-3 py-1 rounded-lg outline-none"
          style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)', color: 'var(--text-1, #333)' }} placeholder="副标题" />
      )}
      {slide.bullets && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>要点</span>
          {slide.bullets.map((b, j) => (
            <div key={j} className="flex gap-1">
              <span className="text-[10px] mt-1.5 text-purple-500">•</span>
              <input value={b} onChange={e => { const bs = [...slide.bullets!]; bs[j] = e.target.value; onUpdate({ ...slide, bullets: bs }); }}
                className="flex-1 text-[12px] px-2 py-1 rounded outline-none"
                style={{ background: 'var(--bg-1, #f9fafb)', color: 'var(--text-0, #1e1e1e)' }} />
              <button onClick={() => onUpdate({ ...slide, bullets: slide.bullets!.filter((_, k) => k !== j) })}
                className="text-[10px] px-1" style={{ color: 'var(--text-2, #999)' }}>×</button>
            </div>
          ))}
          <button onClick={() => onUpdate({ ...slide, bullets: [...(slide.bullets || []), ''] })}
            className="text-[10px] text-purple-500">+ 添加要点</button>
        </div>
      )}
      {slide.keyMetrics && slide.keyMetrics.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>关键指标</span>
          {slide.keyMetrics.map((m, j) => (
            <div key={j} className="flex gap-1.5">
              <input value={m.label} onChange={e => { const ms = [...slide.keyMetrics!]; ms[j] = { ...ms[j], label: e.target.value }; onUpdate({ ...slide, keyMetrics: ms }); }}
                className="flex-1 text-[11px] px-2 py-1 rounded outline-none" style={{ background: 'var(--bg-1, #f9fafb)' }} placeholder="标签" />
              <input value={m.value} onChange={e => { const ms = [...slide.keyMetrics!]; ms[j] = { ...ms[j], value: e.target.value }; onUpdate({ ...slide, keyMetrics: ms }); }}
                className="w-24 text-[11px] px-2 py-1 rounded outline-none font-bold" style={{ background: 'var(--bg-1, #f9fafb)' }} placeholder="值" />
            </div>
          ))}
        </div>
      )}
      {slide.insight !== undefined && (
        <div>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>洞察</span>
          <input value={slide.insight || ''} onChange={e => onUpdate({ ...slide, insight: e.target.value })}
            className="w-full text-[12px] px-3 py-1 rounded-lg outline-none mt-0.5"
            style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)' }} placeholder="💡 洞察" />
        </div>
      )}
      {slide.layout === 'diagram' && (
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>📐 Mermaid 流程图</span>
            <textarea value={slide.mermaidCode || ''} onChange={e => onUpdate({ ...slide, mermaidCode: e.target.value })}
              className="w-full text-[11px] px-3 py-1.5 rounded-lg outline-none mt-0.5 resize-none font-mono"
              rows={6}
              style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)' }}
              placeholder={'graph TD\n  A([开始]) --> B{判断}\n  B -->|是| C[处理]\n  B -->|否| D[结束]'} />
          </div>
          <div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>一句话描述（辅助）</span>
            <input value={slide.diagramDescription || ''} onChange={e => onUpdate({ ...slide, diagramDescription: e.target.value })}
              className="w-full text-[12px] px-3 py-1 rounded-lg outline-none mt-0.5"
              style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)' }}
              placeholder="用户注册流程：输入手机号→验证→创建账户" />
          </div>
        </div>
      )}
    </div>
  );
}
