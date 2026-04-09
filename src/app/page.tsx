'use client';

import { useState } from 'react';
import type { PageCount, StyleTheme, SlideContent, ThemeConfig } from '@/lib/types';
import { layoutPresets } from '@/lib/layouts';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';

const PAGE_OPTIONS: PageCount[] = [5, 10, 15, 20, 25];

const THEMES: { key: StyleTheme; name: string; dot: string }[] = [
  { key: 'google', name: 'Google', dot: '#4285F4' },
  { key: 'amazon', name: 'Amazon', dot: '#FF9900' },
  { key: 'microsoft', name: 'Microsoft', dot: '#0078D4' },
  { key: 'deloitte', name: 'Deloitte', dot: '#86BC25' },
  { key: 'pwc', name: 'PwC', dot: '#D04A02' },
  { key: 'brand', name: 'Custom', dot: '#8B5CF6' },
  { key: 'haio', name: 'Haio', dot: '#52525B' },
];

const SCENES = [
  '技术方案评审', '项目里程碑汇报', '架构设计评审', '故障复盘',
  'OKR/KPI 回顾', '预算申请', '供应商选型', '年度总结',
];

const TYPE_LABEL: Record<string, string> = {
  cover: '封面', toc: '目录', content: '内容', data: '数据',
  comparison: '对比', timeline: '时间线', architecture: '架构',
  summary: '总结', action: '行动', appendix: '附录',
};

interface PreviewResponse {
  previewId: string;
  slides: SlideContent[];
  issues: { page: number; issue: string; severity: string }[];
  score: number;
  research?: { summary: string; keyStats: { metric: string; value: string; source: string }[]; findingsCount?: number; sourcesCount?: number };
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState<PageCount>(10);
  const [theme, setTheme] = useState<StyleTheme>('brand');
  const [scenes, setScenes] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [customColor, setCustomColor] = useState('#8B5CF6');
  const [previewStatus, setPreviewStatus] = useState('');
  const [progressPhase, setProgressPhase] = useState('');
  const [slidesDone, setSlidesDone] = useState(0);

  const currentTheme = theme === 'brand' ? { ...themes.brand, primary: customColor } : themes[theme];

  const handlePreview = async () => {
    if (!topic.trim()) return;
    setPreviewing(true); setPreviewData(null); setActiveSlide(0);
    setPreviewStatus('搜索数据中...'); setProgressPhase('research'); setSlidesDone(0);
    try {
      const res = await fetch('/api/preview-stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description, pageCount, theme, scenes }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const streamSlides: SlideContent[] = [];
      let streamResearch: PreviewResponse['research'] = undefined;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() || '';
        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) { eventType = line.slice(7); continue; }
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (eventType === 'status') { setPreviewStatus(data.message); setProgressPhase(data.phase); }
            else if (eventType === 'research') { streamResearch = data; setProgressPhase('generating'); }
            else if (eventType === 'slide') {
              streamSlides.push(data.slide); setSlidesDone(streamSlides.length);
              setPreviewData(prev => ({ previewId: prev?.previewId || '', slides: [...streamSlides], issues: [], score: 0, research: streamResearch }));
            } else if (eventType === 'done') { setPreviewData({ ...data, research: streamResearch }); setProgressPhase('done'); }
            else if (eventType === 'error') { throw new Error(data.message); }
          }
        }
      }
    } catch (e) { if (!previewData) alert(`生成失败: ${(e as Error).message || '请重试'}`); }
    finally { setPreviewing(false); setPreviewStatus(''); setProgressPhase(''); }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description, pageCount, theme, scenes, previewId: previewData?.previewId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${topic}.pptx`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('生成失败'); }
    finally { setLoading(false); }
  };

  const busy = loading || previewing;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: 'var(--border-0)', background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[1280px] mx-auto h-12 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Gammer</span>
            <span className="text-[10px] px-1.5 py-[1px] rounded font-medium" style={{ color: 'var(--text-2)', border: '1px solid var(--border-0)' }}>v0.0.01</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* ── Left: Config ── */}
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-1)' }}>主题</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="输入演示主题"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition-colors"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-0)'} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-1)' }}>描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="核心论点、关键数据、期望结论"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition-colors"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-0)'} />
          </div>

          {/* Scenes */}
          <div>
            <label className="block text-[13px] font-medium mb-2.5" style={{ color: 'var(--text-1)' }}>场景</label>
            <div className="flex flex-wrap gap-1.5">
              {SCENES.map(s => {
                const active = scenes.includes(s);
                return (
                  <button key={s}
                    onClick={() => active ? setScenes(p => p.split(/[,，]/).filter(x => x.trim() !== s).join('，')) : setScenes(p => p ? `${p}，${s}` : s)}
                    className="h-7 px-3 rounded-md text-[12px] transition-colors"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border-0)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages + Theme row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-medium mb-2.5" style={{ color: 'var(--text-1)' }}>页数</label>
              <div className="flex gap-1">
                {PAGE_OPTIONS.map(n => (
                  <button key={n} onClick={() => { setPageCount(n); setPreviewData(null); }}
                    className="flex-1 h-9 rounded-md text-[13px] font-medium transition-colors"
                    style={{
                      background: pageCount === n ? 'var(--accent)' : 'transparent',
                      color: pageCount === n ? '#fff' : 'var(--text-2)',
                      border: pageCount === n ? 'none' : '1px solid var(--border-0)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-2.5" style={{ color: 'var(--text-1)' }}>风格</label>
              <div className="flex gap-1.5">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)} title={t.name}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                    style={{
                      border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--border-0)',
                      background: theme === t.key ? 'var(--accent-dim)' : 'transparent',
                    }}>
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.key === 'brand' ? customColor : t.dot }} />
                  </button>
                ))}
              </div>
              {theme === 'brand' && (
                <div className="mt-2 flex gap-1.5">
                  {['#8B5CF6', '#7C3AED', '#6D28D9', '#A855F7', '#EC4899', '#06B6D4'].map(c => (
                    <button key={c} onClick={() => setCustomColor(c)}
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{ background: c, outline: customColor === c ? '2px solid var(--text-0)' : 'none', outlineOffset: 2, transform: customColor === c ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handlePreview} disabled={!topic.trim() || busy}
              className="flex-1 h-11 rounded-lg text-[14px] font-medium transition-colors disabled:opacity-30"
              style={{ background: 'transparent', border: '1px solid var(--border-1)', color: 'var(--text-1)' }}>
              {previewing ? <span className="animate-pulse-slow">{previewStatus || '处理中...'}</span> : '预览'}
            </button>
            <button onClick={handleGenerate} disabled={!topic.trim() || busy}
              className="flex-1 h-11 rounded-lg text-[14px] font-medium text-white transition-colors disabled:opacity-30"
              style={{ background: busy ? 'var(--bg-3)' : 'var(--accent)' }}>
              {loading ? <span className="animate-pulse-slow">生成中...</span> : `下载 PPTX`}
            </button>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div>
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl p-4" style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)' }}>
            {previewing && <Progress phase={progressPhase} done={slidesDone} total={pageCount} />}
            {previewData ? (
              <Preview data={previewData} active={activeSlide} setActive={setActiveSlide}
                theme={currentTheme} themeKey={theme} loading={loading} onGenerate={handleGenerate} busy={busy}
                onSlideUpdate={(i, sl) => { const u = { ...previewData, slides: [...previewData.slides] }; u.slides[i] = sl; setPreviewData(u); }}
                onSlidesReplace={sl => setPreviewData({ ...previewData, slides: sl })} />
            ) : !previewing ? (
              <Structure layouts={layoutPresets[pageCount]} theme={currentTheme} count={pageCount} />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Progress ── */
const STEPS = ['搜索', '生成', '检查', '优化'];

function Progress({ phase, done, total }: { phase: string; done: number; total: number }) {
  const map: Record<string, number> = { research: 0, generating: 1, checking: 2, optimizing: 3, done: 4 };
  const idx = map[phase] ?? 0;
  const pct = phase === 'generating' ? 15 + Math.round((done / Math.max(total, 1)) * 60) :
    phase === 'checking' ? 80 : phase === 'optimizing' ? 90 : phase === 'done' ? 100 : 8;

  return (
    <div className="mb-5">
      <div className="flex gap-3 mb-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
              style={{
                background: idx > i ? 'var(--success)' : idx === i ? 'var(--accent)' : 'var(--bg-3)',
                color: idx >= i ? '#fff' : 'var(--text-2)',
              }}>
              {idx > i ? '✓' : i + 1}
            </div>
            <span className="text-[11px]" style={{ color: idx === i ? 'var(--text-0)' : 'var(--text-2)' }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-3)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>
          {phase === 'generating' && done > 0 ? `${done} / ${total} 页` : STEPS[idx] || '准备中'}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── Preview Panel ── */
function Preview({ data, active, setActive, theme, themeKey, loading, onGenerate, busy, onSlideUpdate, onSlidesReplace }: {
  data: PreviewResponse; active: number; setActive: (n: number) => void;
  theme: ThemeConfig; themeKey: StyleTheme; loading: boolean; onGenerate: () => void; busy: boolean;
  onSlideUpdate: (i: number, s: SlideContent) => void; onSlidesReplace: (s: SlideContent[]) => void;
}) {
  const { slides, issues, score, research } = data;
  const s = slides[active];
  const [retryInput, setRetryInput] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalEditing, setGlobalEditing] = useState(false);

  const handleRetry = async () => {
    if (!retryInput.trim() || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch('/api/retry-slide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: data.previewId, slideIndex: active, instruction: retryInput, theme: themeKey }) });
      const json = await res.json();
      if (!res.ok) { alert(json.expired ? '缓存过期，请重新预览' : `失败: ${json.error || res.status}`); return; }
      if (json.slide) { onSlideUpdate(active, json.slide); setRetryInput(''); }
    } catch (e) { alert((e as Error).message); }
    finally { setRetrying(false); }
  };

  const handleGlobalEdit = async () => {
    if (!globalInput.trim() || globalEditing) return;
    setGlobalEditing(true);
    try {
      const res = await fetch('/api/edit-all', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: data.previewId, instruction: globalInput, theme: themeKey }) });
      const json = await res.json();
      if (!res.ok) { alert(json.expired ? '缓存过期，请重新预览' : `失败: ${json.error}`); return; }
      if (json.slides) { onSlidesReplace(json.slides); setGlobalInput(''); }
    } catch (e) { alert((e as Error).message); }
    finally { setGlobalEditing(false); }
  };

  const inputStyle = { background: 'var(--bg-2)', border: '1px solid var(--border-0)', color: 'var(--text-0)' };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-medium flex-1">预览</span>
        {score > 0 && (
          <span className="text-[11px] font-medium tabular-nums" style={{ color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--err)' }}>
            {score}
          </span>
        )}
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>{active + 1}/{slides.length}</span>
      </div>

      {/* Research */}
      {research?.summary && (
        <div className="mb-3 p-3 rounded-lg text-[11px] leading-relaxed" style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}>
          {research.summary}
          {research.keyStats?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {research.keyStats.slice(0, 3).map((st, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>{st.metric} {st.value}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg text-[10px]" style={{ background: 'var(--bg-2)' }}>
          {issues.slice(0, 3).map((iss, i) => (
            <p key={i} style={{ color: 'var(--warn)' }}>P{iss.page}: {iss.issue}</p>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5">
        {slides.map((sl, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="shrink-0 w-9 h-6 rounded text-[8px] font-medium flex items-center justify-center transition-colors"
            style={{
              background: i === active ? 'var(--accent)' : 'var(--bg-2)',
              color: i === active ? '#fff' : 'var(--text-2)',
              border: i === active ? 'none' : '1px solid var(--border-0)',
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Active slide */}
      {s && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>
              {TYPE_LABEL[s.type] || s.type} · {s.layout || 'full-text'}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-0)' }}>
            <SlideRenderer slide={s} theme={theme} themeKey={themeKey} pageNum={active + 1} total={slides.length} />
          </div>
          {s.notes && (
            <p className="mt-2 text-[10px] italic" style={{ color: 'var(--text-2)' }}>{s.notes}</p>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-2 mt-3">
        <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
          className="flex-1 h-8 rounded-md text-[12px] transition-colors disabled:opacity-20"
          style={{ border: '1px solid var(--border-0)', color: 'var(--text-2)', background: 'transparent' }}>
          ←
        </button>
        <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1}
          className="flex-1 h-8 rounded-md text-[12px] transition-colors disabled:opacity-20"
          style={{ border: '1px solid var(--border-0)', color: 'var(--text-2)', background: 'transparent' }}>
          →
        </button>
      </div>

      {/* Edit: single page */}
      <div className="mt-3 flex gap-1.5">
        <input type="text" value={retryInput} onChange={e => setRetryInput(e.target.value)}
          placeholder="修改本页..." onKeyDown={e => e.key === 'Enter' && handleRetry()}
          className="flex-1 h-8 px-2.5 rounded-md text-[12px] outline-none" style={inputStyle} />
        <button onClick={handleRetry} disabled={!retryInput.trim() || retrying}
          className="h-8 px-3 rounded-md text-[12px] font-medium text-white disabled:opacity-30"
          style={{ background: 'var(--accent)' }}>
          {retrying ? '...' : '重试'}
        </button>
      </div>

      {/* Edit: global */}
      <div className="mt-1.5 flex gap-1.5">
        <input type="text" value={globalInput} onChange={e => setGlobalInput(e.target.value)}
          placeholder="全局修改..." onKeyDown={e => e.key === 'Enter' && handleGlobalEdit()}
          className="flex-1 h-8 px-2.5 rounded-md text-[12px] outline-none" style={inputStyle} />
        <button onClick={handleGlobalEdit} disabled={!globalInput.trim() || globalEditing}
          className="h-8 px-3 rounded-md text-[12px] font-medium disabled:opacity-30"
          style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
          {globalEditing ? '...' : '编辑'}
        </button>
      </div>

      {/* Download */}
      <button onClick={onGenerate} disabled={busy}
        className="w-full mt-3 h-10 rounded-lg text-[13px] font-medium text-white disabled:opacity-30"
        style={{ background: 'var(--accent)' }}>
        {loading ? '生成中...' : '下载 PPTX'}
      </button>
    </>
  );
}

/* ── Structure Preview ── */
function Structure({ layouts, theme, count }: {
  layouts: { type: string; label: string }[]; theme: ThemeConfig; count: number;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium">结构</span>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>{count} 页</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {layouts.map((layout, i) => (
          <div key={i} className="slide-mini" style={{ background: i === 0 ? 'var(--accent)' : 'var(--bg-2)' }}>
            <div className="p-1.5 h-full flex flex-col">
              {i === 0 ? (
                <><div className="w-3/4 h-[2px] bg-white/70 rounded mb-0.5" /><div className="w-1/2 h-[2px] bg-white/40 rounded" /></>
              ) : (
                <><div className="w-2/3 h-[2px] rounded mb-0.5" style={{ background: 'var(--accent)' }} /><div className="w-full h-[1px] rounded mb-0.5" style={{ background: 'var(--border-0)' }} /><div className="w-4/5 h-[1px] rounded" style={{ background: 'var(--border-0)' }} /></>
              )}
            </div>
            <div className="slide-label">{layout.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
        点击「预览」生成内容，确认后下载 PPTX。
      </p>
    </>
  );
}
