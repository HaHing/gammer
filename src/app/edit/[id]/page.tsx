'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SlideContent, StyleTheme, ThemeConfig } from '@/lib/types';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';

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

  const updateSlide = (i: number, slide: SlideContent) => {
    const next = [...slides];
    next[i] = slide;
    setSlides(next);
    autoSave(next);
  };

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
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 49px)' }}>
        {/* Thumbnail Nav */}
        <div className="w-48 overflow-y-auto border-r p-2 space-y-2 shrink-0" style={{ borderColor: 'var(--border-0, #222)', background: 'var(--bg-1, #111)' }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => setActive(i)}
              className={`cursor-pointer rounded-lg overflow-hidden transition-all ${active === i ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-gray-600'}`}>
              <div className="text-[8px] px-1.5 py-0.5 flex justify-between" style={{ background: 'var(--bg-2, #1a1a1a)', color: 'var(--text-2, #666)' }}>
                <span>{i + 1}</span>
                <span className="truncate ml-1">{s.title?.slice(0, 12)}</span>
              </div>
              <div className="pointer-events-none scale-[0.25] origin-top-left" style={{ width: 400, height: 225 }}>
                <SlideRenderer slide={s} theme={themeConfig} themeKey={themeKey} pageNum={i + 1} total={slides.length} />
              </div>
            </div>
          ))}
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
        <div>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-2, #666)' }}>📐 图表描述</span>
          <textarea value={slide.diagramDescription || ''} onChange={e => onUpdate({ ...slide, diagramDescription: e.target.value })}
            className="w-full text-[12px] px-3 py-1.5 rounded-lg outline-none mt-0.5 resize-none" rows={2}
            style={{ background: 'var(--bg-1, #f9fafb)', border: '1px solid var(--border-0, #e5e7eb)' }} placeholder="用自然语言描述图表，如：用户注册流程：输入手机号→验证→创建账户" />
        </div>
      )}
    </div>
  );
}
