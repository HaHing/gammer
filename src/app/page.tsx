'use client';

import { useState } from 'react';
import type { PageCount, StyleTheme, SlideContent, ThemeConfig } from '@/lib/types';
import { layoutPresets } from '@/lib/layouts';
import { themes } from '@/lib/themes';

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
  const [theme, setTheme] = useState<StyleTheme>('google');
  const [scenes, setScenes] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [customColor, setCustomColor] = useState('#7C3AED');

  const currentTheme = theme === 'brand' ? { ...themes.brand, primary: customColor } : themes[theme];

  const [previewStatus, setPreviewStatus] = useState('');

  const handlePreview = async () => {
    if (!topic.trim()) return;
    setPreviewing(true);
    setPreviewData(null);
    setPreviewStatus('正在搜索权威数据源...');
    try {
      const t1 = setTimeout(() => setPreviewStatus('正在分析研究数据...'), 30000);
      const t2 = setTimeout(() => setPreviewStatus('AI 正在生成专业内容...'), 60000);
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description, pageCount, theme, scenes }),
      });
      [t1, t2].forEach(clearTimeout);
      if (!res.ok) throw new Error();
      const data: PreviewResponse = await res.json();
      setPreviewData(data);
      setActiveSlide(0);
    } catch {
      alert('预览生成失败，请重试');
    } finally {
      setPreviewing(false);
      setPreviewStatus('');
    }
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
      a.href = url;
      a.download = `${topic}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || previewing;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: currentTheme.primary }}>G</div>
            <span className="text-lg font-semibold tracking-tight">Gammer</span>
            <span className="text-[11px] text-[var(--text-secondary)] border border-[var(--border)] rounded px-1.5 py-0.5">Beta</span>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">落地 · 清晰 · 专业</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-white rounded-xl border border-[var(--border)] p-5">
            <label className="block text-sm font-medium mb-1.5">演示主题 <span className="text-red-400">*</span></label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="例如：2024年Q3技术架构升级方案"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm" />
          </section>

          <section className="bg-white rounded-xl border border-[var(--border)] p-5">
            <label className="block text-sm font-medium mb-1.5">详细描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="描述核心论点、关键数据、期望结论。内容越详细，生成质量越高。"
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm resize-none" />
          </section>

          <section className="bg-white rounded-xl border border-[var(--border)] p-5">
            <label className="block text-sm font-medium mb-2">汇报场景</label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SCENE_PRESETS.map(s => {
                const active = scenes.includes(s);
                return (
                  <button key={s}
                    onClick={() => active ? setScenes(p => p.split(/[,，]/).filter(x => x.trim() !== s).join('，')) : setScenes(p => p ? `${p}，${s}` : s)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${active ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)]' : 'border-[var(--border)] hover:border-gray-300 text-[var(--text-secondary)]'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            <input type="text" value={scenes} onChange={e => setScenes(e.target.value)} placeholder="自定义场景，用逗号分隔"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-xs" />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-[var(--border)] p-5">
              <label className="block text-sm font-medium mb-2">页数</label>
              <div className="flex gap-2">
                {PAGE_OPTIONS.map(n => (
                  <button key={n} onClick={() => { setPageCount(n); setPreviewData(null); }}
                    className={`flex-1 py-2 rounded-lg border-2 text-center text-sm font-medium transition-all ${pageCount === n ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)]' : 'border-[var(--border)] hover:border-gray-300 text-[var(--text-secondary)]'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">{PAGE_DESC[pageCount]}</p>
            </section>

            <section className="bg-white rounded-xl border border-[var(--border)] p-5">
              <label className="block text-sm font-medium mb-2">设计风格</label>
              <div className="grid grid-cols-6 gap-1.5">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)}
                    className={`p-1.5 rounded-lg border-2 text-center transition-all ${theme === t.key ? 'border-[var(--primary)] shadow-sm' : 'border-[var(--border)] hover:border-gray-300'}`}>
                    <div className="w-5 h-5 rounded-full mx-auto mb-0.5" style={{ backgroundColor: t.key === 'brand' ? customColor : t.color }} />
                    <div className="text-[9px] font-medium leading-tight">{t.name}</div>
                  </button>
                ))}
              </div>
              {theme === 'brand' && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer" />
                    {['#7C3AED', '#8B5CF6', '#6D28D9', '#A855F7', '#9333EA', '#C084FC'].map(c => (
                      <button key={c} onClick={() => setCustomColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${customColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="flex gap-3">
            <button onClick={handlePreview} disabled={!topic.trim() || busy}
              className="flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all disabled:opacity-40"
              style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>
              {previewing ? <span className="animate-pulse-slow">🔍 {previewStatus || '处理中...'}</span> : '预览内容'}
            </button>
            <button onClick={handleGenerate} disabled={!topic.trim() || busy}
              className="flex-1 py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-40"
              style={{ background: busy ? '#999' : currentTheme.primary }}>
              {loading ? <span className="animate-pulse-slow">生成 PPTX 中...</span> : `下载 ${pageCount} 页 PPTX`}
            </button>
          </div>
        </div>

        {/* Right: Preview panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {previewData ? (
              <PreviewPanel data={previewData} activeSlide={activeSlide} setActiveSlide={setActiveSlide}
                theme={currentTheme} loading={loading} onGenerate={handleGenerate} busy={busy} />
            ) : (
              <StructurePreview layouts={layoutPresets[pageCount]} theme={currentTheme} pageCount={pageCount}
                themeName={THEMES.find(t => t.key === theme)?.name || ''} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PreviewPanel({ data, activeSlide, setActiveSlide, theme, loading, onGenerate, busy }: {
  data: PreviewResponse; activeSlide: number; setActiveSlide: (n: number) => void;
  theme: ThemeConfig; loading: boolean; onGenerate: () => void; busy: boolean;
}) {
  const { slides, issues, score, research } = data;
  const s = slides[activeSlide];

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium flex-1">内容预览</h3>
        {score !== null && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${score >= 80 ? 'bg-green-50 text-green-700' : score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
            质量 {score}分
          </span>
        )}
        <span className="text-[11px] text-[var(--text-secondary)]">{activeSlide + 1}/{slides.length}</span>
      </div>

      {/* Research summary */}
      {research?.summary && (
        <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-medium text-blue-700">📚 研究摘要</p>
            {research.findingsCount && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{research.findingsCount} 条发现</span>}
            {research.sourcesCount && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{research.sourcesCount} 个来源</span>}
          </div>
          <p className="text-[10px] text-blue-600 leading-relaxed">{research.summary}</p>
          {research.keyStats && research.keyStats.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {research.keyStats.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[9px] bg-white px-1.5 py-0.5 rounded text-blue-700">{s.metric}: {s.value}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          {issues.map((iss, i) => (
            <p key={i} className="text-[10px] text-amber-600">⚠️ P{iss.page}: {iss.issue}</p>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {slides.map((sl, i) => (
          <button key={i} onClick={() => setActiveSlide(i)}
            className={`shrink-0 w-10 h-6 rounded text-[7px] flex items-center justify-center border transition-all ${i === activeSlide ? 'border-2 shadow-sm' : 'border-[var(--border)]'}`}
            style={{
              background: sl.type === 'cover' ? theme.primary : '#fff',
              color: sl.type === 'cover' ? '#fff' : theme.primary,
              borderColor: i === activeSlide ? theme.primary : undefined,
            }}>
            {SLIDE_ICON[sl.type] || (i + 1)}
          </button>
        ))}
      </div>

      {/* Active slide detail */}
      {s && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3" style={{ background: s.type === 'cover' ? theme.primary : theme.lightGray }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">{SLIDE_ICON[s.type] || '📝'}</span>
              <span className="text-[10px] font-medium" style={{ color: s.type === 'cover' ? 'rgba(255,255,255,0.7)' : theme.secondary }}>
                {s.type} {s.layout ? `· ${s.layout}` : ''}
              </span>
              {s.needsImage && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">纯渲染</span>
              )}
            </div>
            <h4 className="text-sm font-semibold" style={{ color: s.type === 'cover' ? '#fff' : theme.text }}>{s.title}</h4>
            {s.subtitle && <p className="text-xs mt-0.5" style={{ color: s.type === 'cover' ? 'rgba(255,255,255,0.8)' : theme.secondary }}>{s.subtitle}</p>}
          </div>

          <div className="px-4 py-3 space-y-2">
            {s.keyMetrics && s.keyMetrics.length > 0 && (
              <div className="flex gap-2">
                {s.keyMetrics.map((m, j) => (
                  <div key={j} className="flex-1 text-center p-2 rounded" style={{ background: theme.lightGray }}>
                    <div className="text-sm font-bold" style={{ color: theme.primary }}>{m.value}{m.unit ? ` ${m.unit}` : ''}</div>
                    <div className="text-[9px] text-[var(--text-secondary)]">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            {s.insight && (
              <div className="p-2 rounded text-[11px] font-medium" style={{ background: theme.lightGray, color: theme.primary, borderLeft: `3px solid ${theme.accent}` }}>
                💡 {s.insight}
              </div>
            )}

            {s.bullets && s.bullets.length > 0 && (
              <ul className="space-y-1">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-[11px]">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: theme.primary }} />
                    <span className="text-[var(--text)]">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {s.chartData && s.chartData.length > 0 && (
              <div className="flex gap-1 items-end h-16">
                {s.chartData.map((d, j) => {
                  const max = Math.max(...s.chartData!.map(x => x.value));
                  const h = max > 0 ? (d.value / max) * 100 : 0;
                  return (
                    <div key={j} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-medium" style={{ color: theme.primary }}>{d.value}</span>
                      <div className="w-full rounded-t" style={{ height: `${h}%`, background: j % 2 === 0 ? theme.primary : theme.accent, minHeight: 2 }} />
                      <span className="text-[7px] text-[var(--text-secondary)] truncate w-full text-center">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {s.source && <p className="text-[9px] text-[var(--text-secondary)] italic">📎 {s.source}</p>}
            {s.notes && (
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-secondary)] italic">🎤 {s.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0}
          className="flex-1 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-30">← 上一页</button>
        <button onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1}
          className="flex-1 py-1.5 text-xs rounded border border-[var(--border)] disabled:opacity-30">下一页 →</button>
      </div>

      <button onClick={onGenerate} disabled={busy}
        className="w-full mt-3 py-2.5 rounded-lg text-white text-xs font-medium transition-all disabled:opacity-40"
        style={{ background: busy ? '#999' : theme.primary }}>
        {loading ? '生成中...' : '✓ 确认内容，下载 PPTX'}
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
        <h3 className="text-sm font-medium">页面结构预览</h3>
        <span className="text-[11px] text-[var(--text-secondary)]">{pageCount} 页 · {themeName}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout, i) => (
          <div key={i} className="slide-preview" style={{ background: i === 0 ? theme.primary : '#fff' }}>
            <div className="p-1.5 h-full flex flex-col justify-between">
              <div>
                {i === 0 ? (
                  <><div className="w-3/4 h-[3px] bg-white/80 rounded mb-1" /><div className="w-1/2 h-[2px] bg-white/50 rounded" /></>
                ) : (
                  <><div className="w-2/3 h-[3px] rounded mb-1" style={{ background: theme.primary }} /><div className="w-full h-[2px] bg-gray-200 rounded mb-0.5" /><div className="w-4/5 h-[2px] bg-gray-200 rounded" /></>
                )}
              </div>
            </div>
            <div className="slide-label">
              <span className="mr-0.5">{SLIDE_ICON[layout.type] || '📝'}</span>{layout.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          💡 点击"预览内容"→ AI 搜索权威数据 → 生成咨询级内容 → 确认后下载 PPTX
        </p>
      </div>
    </>
  );
}
