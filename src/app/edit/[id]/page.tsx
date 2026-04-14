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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-0, #e5e5e5)' }}>
      <div className="text-center">
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-2, #222)' }}>返回</button>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-2, #888)' }}>
      加载中...
    </div>
  );

  const themeKey = (project.theme || 'brand') as StyleTheme;
  const themeConfig: ThemeConfig = themes[themeKey] || themes.brand;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-0, #e5e5e5)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border-0, #222)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-sm hover:opacity-80" style={{ color: 'var(--text-2, #888)' }}>← 返回</button>
          <span className="text-sm font-medium">{project.title}</span>
          {saving && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2, #222)', color: 'var(--text-2, #888)' }}>保存中...</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-2, #888)' }}>{slides.length} 页</span>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 49px)' }}>
        {/* Thumbnail Nav */}
        <div className="w-48 overflow-y-auto border-r p-2 space-y-2 shrink-0" style={{ borderColor: 'var(--border-0, #222)', background: 'var(--bg-1, #111)' }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => setActive(i)}
              className={`cursor-pointer rounded-lg overflow-hidden transition-all ${active === i ? 'ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-gray-600'}`}>
              <div className="text-[8px] px-1.5 py-0.5 flex justify-between" style={{ background: 'var(--bg-2, #1a1a1a)', color: 'var(--text-2, #888)' }}>
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
            {slides.map((s, i) => (
              <div key={i} id={`slide-${i}`} className={`transition-all ${active === i ? 'ring-2 ring-purple-500 rounded-xl' : ''}`}
                onClick={() => setActive(i)}>
                <SlideRenderer slide={s} theme={themeConfig} themeKey={themeKey} pageNum={i + 1} total={slides.length}
                  editable onUpdate={(updated) => updateSlide(i, updated)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
