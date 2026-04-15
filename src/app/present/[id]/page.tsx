'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SlideContent, StyleTheme, ThemeConfig } from '@/lib/types';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';

export default function PresentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [active, setActive] = useState(0);
  const [themeKey, setThemeKey] = useState<StyleTheme>('brand');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => {
      if (!r.ok) { setError('项目不存在或无权限'); return; }
      return r.json();
    }).then(d => {
      if (d) { setSlides(d.slides || []); setThemeKey((d.theme || 'brand') as StyleTheme); }
    }).catch(() => setError('加载失败'));
  }, [id]);

  const prev = useCallback(() => setActive(a => Math.max(0, a - 1)), []);
  const next = useCallback(() => setActive(a => Math.min(slides.length - 1, a + 1)), [slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      else if (e.key === 'Escape') router.push(`/edit/${id}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, router, id]);

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-white/10 text-sm">返回</button>
      </div>
    </div>
  );

  if (!slides.length) return <div className="h-screen flex items-center justify-center bg-black text-white/50">加载中...</div>;

  const themeConfig: ThemeConfig = themes[themeKey] || themes.brand;

  return (
    <div className="h-screen bg-black flex items-center justify-center relative cursor-none group" onClick={next}>
      <div className="w-full max-h-full aspect-[16/9] max-w-[100vw]">
        <SlideRenderer slide={slides[active]} theme={themeConfig} themeKey={themeKey} pageNum={active + 1} total={slides.length} />
      </div>
      {/* Navigation overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-default">
        <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={active === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-0 hover:bg-white/20">
          ‹
        </button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={active === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-0 hover:bg-white/20">
          ›
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="text-white/60 text-sm tabular-nums">{active + 1} / {slides.length}</span>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/edit/${id}`); }}
            className="text-white/40 text-xs hover:text-white/80 px-2 py-1 rounded bg-white/5">ESC 退出</button>
        </div>
      </div>
    </div>
  );
}
