'use client';

import { useState } from 'react';
import type { PageCount, StyleTheme, SlideContent, ThemeConfig } from '@/lib/types';
import { layoutPresets } from '@/lib/layouts';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';

const PAGE_OPTIONS: PageCount[] = [5, 10, 15, 20, 25];

const THEMES: { key: StyleTheme; name: string; color: string; desc: string }[] = [
  { key: 'google', name: 'Google', color: '#1A73E8', desc: '简洁·数据驱动' },
  { key: 'amazon', name: 'Amazon', color: '#FF9900', desc: '高密度·叙事' },
  { key: 'microsoft', name: 'Microsoft', color: '#0078D4', desc: '清晰·蓝灰' },
  { key: 'deloitte', name: 'Deloitte', color: '#86BC25', desc: '严谨·规范' },
  { key: 'pwc', name: 'PwC', color: '#D04A02', desc: '暖色·结构化' },
  { key: 'brand', name: '炫彩紫', color: '#7C3AED', desc: '渐变紫·科技感' },
  { key: 'haio', name: 'Haio', color: '#1B1F2A', desc: '深色·极简商务' },
];

const SCENE_PRESETS = [
  '技术方案评审', '项目里程碑汇报', '架构设计评审', '故障复盘',
  'OKR/KPI 回顾', '预算申请', '供应商选型', '年度总结',
];

const PAGE_DESC: Record<PageCount, string> = {
  5: '精简模式 — 封面 + 目录 + 3页核心',
  10: '标准模式 — 含数据展示和对比分析',
  15: '详细模式 — 完整论述链 + 路线图',
  20: '深度模式 — 含架构设计和风险评估',
  25: '完整模式 — 全维度深度展开',
};

const SLIDE_ICON: Record<string, string> = {
  cover: '🎯', toc: '📋', content: '📝', data: '📊',
  comparison: '⚖️', timeline: '📅', architecture: '🏗️',
  summary: '✅', action: '🚀', appendix: '📎',
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
  const [customColor, setCustomColor] = useState('#7C3AED');
  const [previewStatus, setPreviewStatus] = useState('');
  const [progressPhase, setProgressPhase] = useState<string>('');
  const [slidesDone, setSlidesDone] = useState(0);

  const currentTheme = theme === 'brand' ? { ...themes.brand, primary: customColor } : themes[theme];

  const handlePreview = async () => {
    if (!topic.trim()) return;
    setPreviewing(true);
    setPreviewData(null);
    setActiveSlide(0);
    setPreviewStatus('正在搜索权威数据源...');
    setProgressPhase('research');
    setSlidesDone(0);
    try {
      const res = await fetch('/api/preview-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) { eventType = line.slice(7); continue; }
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (eventType === 'status') { setPreviewStatus(data.message); setProgressPhase(data.phase); }
            else if (eventType === 'research') { streamResearch = data; setProgressPhase('generating'); }
            else if (eventType === 'slide') {
              streamSlides.push(data.slide);
              setSlidesDone(streamSlides.length);
              setPreviewData(prev => ({ previewId: prev?.previewId || '', slides: [...streamSlides], issues: prev?.issues || [], score: 0, research: streamResearch }));
            } else if (eventType === 'done') { setPreviewData({ ...data, research: streamResearch }); setProgressPhase('done'); }
            else if (eventType === 'error') { throw new Error(data.message); }
          }
        }
      }
    } catch (e) {
      if (!previewData) alert(`预览生成失败: ${(e as Error).message || '请重试'}`);
    } finally { setPreviewing(false); setPreviewStatus(''); setProgressPhase(''); }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description, pageCount, theme, scenes, previewId: previewData?.previewId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${topic}.pptx`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('生成失败，请重试'); }
    finally { setLoading(false); }
  };

  const busy = loading || previewing;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      {/* Header */}
      <header className="relative z-20 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(15,11,26,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base" style={{ background: 'var(--gradient-primary)' }}>G</div>
            <div>
              <span className="text-lg font-bold tracking-tight glow-text" style={{ color: 'var(--text)' }}>Gammer</span>
              <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--primary-light)', border: '1px solid var(--border)' }}>v0.0.01</span>
            </div>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Presentation Engine</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-4">
          {/* Topic */}
          <section className="glass-card p-5">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
              演示主题 <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="例如：2024年Q3技术架构升级方案" className="gm-input" />
          </section>

          {/* Description */}
          <section className="glass-card p-5">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>详细描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="描述核心论点、关键数据、期望结论。内容越详细，生成质量越高。"
              rows={4} className="gm-input gm-textarea" />
          </section>

          {/* Scenes */}
          <section className="glass-card p-5">
            <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--text)' }}>汇报场景</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SCENE_PRESETS.map(s => {
                const active = scenes.includes(s);
                return (
                  <button key={s}
                    onClick={() => active ? setScenes(p => p.split(/[,，]/).filter(x => x.trim() !== s).join('，')) : setScenes(p => p ? `${p}，${s}` : s)}
                    className={`gm-tag ${active ? 'gm-tag-active' : ''}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            <input type="text" value={scenes} onChange={e => setScenes(e.target.value)}
              placeholder="自定义场景，用逗号分隔" className="gm-input" style={{ fontSize: '12px' }} />
          </section>

          {/* Page count + Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="glass-card p-5">
              <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--text)' }}>页数</label>
              <div className="flex gap-2">
                {PAGE_OPTIONS.map(n => (
                  <button key={n} onClick={() => { setPageCount(n); setPreviewData(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${pageCount === n ? '' : 'gm-btn-ghost'}`}
                    style={pageCount === n ? { background: 'var(--gradient-primary)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' } : undefined}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{PAGE_DESC[pageCount]}</p>
            </section>

            <section className="glass-card p-5">
              <label className="block text-sm font-semibold mb-2.5" style={{ color: 'var(--text)' }}>设计风格</label>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)}
                    className="p-2 rounded-xl text-center transition-all"
                    style={{
                      border: theme === t.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: theme === t.key ? 'var(--accent-glow)' : 'transparent',
                      boxShadow: theme === t.key ? '0 0 16px rgba(124,58,237,0.2)' : 'none',
                    }}>
                    <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: t.key === 'brand' ? customColor : t.color, boxShadow: theme === t.key ? `0 0 8px ${t.color}60` : 'none' }} />
                    <div className="text-[9px] font-medium" style={{ color: theme === t.key ? 'var(--primary-light)' : 'var(--text-secondary)' }}>{t.name}</div>
                  </button>
                ))}
              </div>
              {theme === 'brand' && (
                <div className="mt-2.5 pt-2.5 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer" />
                  {['#7C3AED', '#8B5CF6', '#6D28D9', '#A855F7', '#9333EA', '#C084FC'].map(c => (
                    <button key={c} onClick={() => setCustomColor(c)}
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{ background: c, border: customColor === c ? '2px solid #fff' : '2px solid transparent', transform: customColor === c ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handlePreview} disabled={!topic.trim() || busy} className="flex-1 gm-btn-outline">
              {previewing ? <span className="animate-pulse-slow">🔍 {previewStatus || '处理中...'}</span> : '✦ 预览内容'}
            </button>
            <button onClick={handleGenerate} disabled={!topic.trim() || busy} className="flex-1 gm-btn-primary">
              {loading ? <span className="animate-pulse-slow">生成中...</span> : `⬇ 下载 ${pageCount} 页 PPTX`}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto glow-purple">
            {previewing && <ProgressBar phase={progressPhase} slidesDone={slidesDone} total={pageCount} />}
            {previewData ? (
              <PreviewPanel data={previewData} activeSlide={activeSlide} setActiveSlide={setActiveSlide}
                theme={currentTheme} themeKey={theme} loading={loading} onGenerate={handleGenerate} busy={busy}
                onSlideUpdate={(idx, slide) => { const u = { ...previewData, slides: [...previewData.slides] }; u.slides[idx] = slide; setPreviewData(u); }}
                onSlidesReplace={(slides) => setPreviewData({ ...previewData, slides })} />
            ) : !previewing ? (
              <StructurePreview layouts={layoutPresets[pageCount]} theme={currentTheme} pageCount={pageCount}
                themeName={THEMES.find(t => t.key === theme)?.name || ''} />
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Gammer v0.0.01 — AI Presentation Engine</span>
      </footer>
    </div>
  );
}

const PHASES = [
  { key: 'research', icon: '🔍', label: '数据搜索' },
  { key: 'generating', icon: '✍️', label: '内容生成' },
  { key: 'checking', icon: '✅', label: '质量检查' },
  { key: 'optimizing', icon: '⚡', label: '内容优化' },
  { key: 'done', icon: '🎉', label: '完成' },
];

function ProgressBar({ phase, slidesDone, total }: { phase: string; slidesDone: number; total: number }) {
  const phaseIdx = PHASES.findIndex(p => p.key === phase);
  let pct = 5;
  if (phase === 'research') pct = 10;
  else if (phase === 'generating') pct = 15 + Math.round((slidesDone / Math.max(total, 1)) * 65);
  else if (phase === 'checking') pct = 85;
  else if (phase === 'optimizing') pct = 92;
  else if (phase === 'done') pct = 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        {PHASES.slice(0, -1).map((p, i) => {
          const isActive = p.key === phase;
          const isDone = phaseIdx > i;
          return (
            <div key={p.key} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-all ${isActive ? 'animate-pulse' : ''}`}
                style={{
                  background: isDone ? 'rgba(52,211,153,0.15)' : isActive ? 'var(--accent-glow)' : 'transparent',
                  border: isDone ? '1.5px solid var(--success)' : isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                }}>
                {isDone ? <span style={{ color: 'var(--success)' }}>✓</span> : p.icon}
              </div>
              <span className="text-[10px] hidden sm:inline" style={{ color: isActive ? 'var(--primary-light)' : isDone ? 'var(--success)' : 'var(--text-muted)' }}>
                {p.label}
              </span>
              {i < 3 && <span className="text-[8px] mx-1" style={{ color: 'var(--text-muted)' }}>→</span>}
            </div>
          );
        })}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {phase === 'generating' && slidesDone > 0 ? `已生成 ${slidesDone}/${total} 页` : PHASES[phaseIdx]?.label || '准备中...'}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--primary-light)' }}>{pct}%</span>
      </div>
    </div>
  );
}

function PreviewPanel({ data, activeSlide, setActiveSlide, theme, themeKey, loading, onGenerate, busy, onSlideUpdate, onSlidesReplace }: {
  data: PreviewResponse; activeSlide: number; setActiveSlide: (n: number) => void;
  theme: ThemeConfig; themeKey: StyleTheme; loading: boolean; onGenerate: () => void; busy: boolean;
  onSlideUpdate: (idx: number, slide: SlideContent) => void;
  onSlidesReplace: (slides: SlideContent[]) => void;
}) {
  const { slides, issues, score, research } = data;
  const s = slides[activeSlide];
  const [retryInput, setRetryInput] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalEditing, setGlobalEditing] = useState(false);

  const handleRetry = async () => {
    if (!retryInput.trim() || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch('/api/retry-slide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: data.previewId, slideIndex: activeSlide, instruction: retryInput, theme: themeKey }) });
      const json = await res.json();
      if (!res.ok) { alert(json.expired ? '预览缓存已过期，请重新预览' : `重试失败: ${json.error || res.status}`); return; }
      if (json.slide) { onSlideUpdate(activeSlide, json.slide); setRetryInput(''); }
    } catch (e) { alert(`请求失败: ${(e as Error).message}`); }
    finally { setRetrying(false); }
  };

  const handleGlobalEdit = async () => {
    if (!globalInput.trim() || globalEditing) return;
    setGlobalEditing(true);
    try {
      const res = await fetch('/api/edit-all', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: data.previewId, instruction: globalInput, theme: themeKey }) });
      const json = await res.json();
      if (!res.ok) { alert(json.expired ? '预览缓存已过期，请重新预览' : `编辑失败: ${json.error}`); return; }
      if (json.slides) { onSlidesReplace(json.slides); setGlobalInput(''); }
    } catch (e) { alert(`请求失败: ${(e as Error).message}`); }
    finally { setGlobalEditing(false); }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold flex-1" style={{ color: 'var(--text)' }}>内容预览</h3>
        {score > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: score >= 80 ? 'rgba(52,211,153,0.15)' : score >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
              color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)' }}>
            {score}分
          </span>
        )}
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{activeSlide + 1}/{slides.length}</span>
      </div>

      {research?.summary && (
        <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[10px] font-semibold" style={{ color: 'var(--primary-light)' }}>📚 研究摘要</p>
            {research.findingsCount && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--primary-light)' }}>{research.findingsCount} 条发现</span>}
            {research.sourcesCount && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--primary-light)' }}>{research.sourcesCount} 个来源</span>}
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{research.summary}</p>
          {research.keyStats?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {research.keyStats.slice(0, 4).map((st, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface)', color: 'var(--primary-light)' }}>{st.metric}: {st.value}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          {issues.map((iss, i) => (
            <p key={i} className="text-[10px]" style={{ color: 'var(--warning)' }}>⚠️ P{iss.page}: {iss.issue}</p>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {slides.map((sl, i) => (
          <button key={i} onClick={() => setActiveSlide(i)}
            className="shrink-0 w-11 h-7 rounded-lg text-[7px] flex items-center justify-center transition-all"
            style={{
              background: i === activeSlide ? (sl.type === 'cover' ? 'var(--gradient-primary)' : 'var(--accent-glow)') : 'var(--bg-surface)',
              color: i === activeSlide ? '#fff' : 'var(--text-muted)',
              border: i === activeSlide ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              boxShadow: i === activeSlide ? '0 0 8px rgba(124,58,237,0.3)' : 'none',
            }}>
            {SLIDE_ICON[sl.type] || (i + 1)}
          </button>
        ))}
      </div>

      {/* Active slide */}
      {s && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-xs">{SLIDE_ICON[s.type] || '📝'}</span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.type} · {s.layout || 'full-text'}</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <SlideRenderer slide={s} theme={theme} themeKey={themeKey} pageNum={activeSlide + 1} total={slides.length} />
          </div>
          {s.notes && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>🎤 {s.notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0} className="flex-1 gm-btn-ghost">← 上一页</button>
        <button onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1} className="flex-1 gm-btn-ghost">下一页 →</button>
      </div>

      {/* Edit inputs */}
      <div className="mt-3 flex gap-1.5">
        <input type="text" value={retryInput} onChange={e => setRetryInput(e.target.value)}
          placeholder="修改本页：加表格、换布局..." onKeyDown={e => e.key === 'Enter' && handleRetry()}
          className="gm-input" style={{ fontSize: '11px', padding: '8px 12px' }} />
        <button onClick={handleRetry} disabled={!retryInput.trim() || retrying} className="gm-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
          {retrying ? '...' : '🔄'}
        </button>
      </div>
      <div className="mt-2 flex gap-1.5">
        <input type="text" value={globalInput} onChange={e => setGlobalInput(e.target.value)}
          placeholder="全局修改：改风格、加数据、调语气..." onKeyDown={e => e.key === 'Enter' && handleGlobalEdit()}
          className="gm-input" style={{ fontSize: '11px', padding: '8px 12px' }} />
        <button onClick={handleGlobalEdit} disabled={!globalInput.trim() || globalEditing} className="gm-btn-outline" style={{ padding: '8px 14px', fontSize: '12px' }}>
          {globalEditing ? '...' : '✨'}
        </button>
      </div>

      <button onClick={onGenerate} disabled={busy} className="w-full mt-3 gm-btn-primary">
        {loading ? '生成中...' : '⬇ 确认内容，下载 PPTX'}
      </button>
    </>
  );
}

function StructurePreview({ layouts, theme, pageCount, themeName }: {
  layouts: { type: string; label: string }[]; theme: ThemeConfig; pageCount: number; themeName: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>页面结构预览</h3>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{pageCount} 页 · {themeName}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout, i) => (
          <div key={i} className="slide-preview" style={{ background: i === 0 ? 'var(--gradient-primary)' : 'var(--bg-surface)' }}>
            <div className="p-1.5 h-full flex flex-col justify-between">
              <div>
                {i === 0 ? (
                  <><div className="w-3/4 h-[3px] bg-white/80 rounded mb-1" /><div className="w-1/2 h-[2px] bg-white/50 rounded" /></>
                ) : (
                  <><div className="w-2/3 h-[3px] rounded mb-1" style={{ background: 'var(--primary)' }} /><div className="w-full h-[2px] rounded mb-0.5" style={{ background: 'var(--border)' }} /><div className="w-4/5 h-[2px] rounded" style={{ background: 'var(--border)' }} /></>
                )}
              </div>
            </div>
            <div className="slide-label">
              <span className="mr-0.5">{SLIDE_ICON[layout.type] || '📝'}</span>{layout.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3.5 rounded-xl" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          ✦ 点击「预览内容」→ AI 搜索权威数据 → 生成咨询级内容 → 确认后下载 PPTX
        </p>
      </div>
    </>
  );
}
