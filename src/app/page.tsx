'use client';

import { useState } from 'react';
import type { PageCount, StyleTheme, SlideContent, ThemeConfig, OutlineItem } from '@/lib/types';
import { layoutPresets } from '@/lib/layouts';
import { themes } from '@/lib/themes';
import SlideRenderer from '@/components/SlideRenderer';

const PAGE_OPTIONS: PageCount[] = [5, 10, 15, 20, 25];

// SVG icon components — purple (#7C3AED) stroke
const P = '#7C3AED';
const Icon = {
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  left: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  right: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  refresh: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  edit: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  file: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  layers: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  palette: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// Per-theme color palettes: 5 shade/combo options each
const THEME_PALETTES: Record<StyleTheme, { primary: string; accent: string; label: string }[]> = {
  google: [
    { primary: '#1A73E8', accent: '#EA4335', label: '经典蓝' },
    { primary: '#0D47A1', accent: '#FF5722', label: '深海蓝' },
    { primary: '#4285F4', accent: '#FBBC04', label: '天空蓝' },
    { primary: '#1565C0', accent: '#43A047', label: '蓝绿搭' },
    { primary: '#2196F3', accent: '#E91E63', label: '蓝粉搭' },
  ],
  amazon: [
    { primary: '#232F3E', accent: '#FF9900', label: '经典橙' },
    { primary: '#131921', accent: '#FFB84D', label: '深夜橙' },
    { primary: '#37475A', accent: '#FF9900', label: '浅灰橙' },
    { primary: '#232F3E', accent: '#00A8E1', label: '蓝色系' },
    { primary: '#485769', accent: '#F0C14B', label: '金色系' },
  ],
  microsoft: [
    { primary: '#0078D4', accent: '#D83B01', label: '经典蓝' },
    { primary: '#005A9E', accent: '#E74856', label: '深蓝红' },
    { primary: '#0099BC', accent: '#FFB900', label: '青金搭' },
    { primary: '#2B579A', accent: '#217346', label: 'Office' },
    { primary: '#00B7C3', accent: '#8764B8', label: '青紫搭' },
  ],
  deloitte: [
    { primary: '#86BC25', accent: '#0D8390', label: '经典绿' },
    { primary: '#43B02A', accent: '#00A3E0', label: '亮绿蓝' },
    { primary: '#6B9E1F', accent: '#333333', label: '沉稳绿' },
    { primary: '#0D8390', accent: '#86BC25', label: '青绿搭' },
    { primary: '#26890D', accent: '#62B5E5', label: '森林蓝' },
  ],
  pwc: [
    { primary: '#D04A02', accent: '#EB8C00', label: '经典橙' },
    { primary: '#A3370A', accent: '#D4A843', label: '深橙金' },
    { primary: '#E0602B', accent: '#2D2D2D', label: '亮橙灰' },
    { primary: '#C23616', accent: '#F39C12', label: '红金搭' },
    { primary: '#D04A02', accent: '#0077B6', label: '橙蓝搭' },
  ],
  brand: [
    { primary: '#7C3AED', accent: '#EC4899', label: '紫粉搭' },
    { primary: '#6D28D9', accent: '#F59E0B', label: '深紫金' },
    { primary: '#8B5CF6', accent: '#06B6D4', label: '紫青搭' },
    { primary: '#A855F7', accent: '#10B981', label: '亮紫绿' },
    { primary: '#5B21B6', accent: '#F43F5E', label: '暗紫红' },
  ],
  haio: [
    { primary: '#2563EB', accent: '#0D9488', label: '蓝青搭' },
    { primary: '#1D4ED8', accent: '#6366F1', label: '深蓝紫' },
    { primary: '#3B82F6', accent: '#F59E0B', label: '蓝金搭' },
    { primary: '#1E40AF', accent: '#059669', label: '深蓝绿' },
    { primary: '#60A5FA', accent: '#A78BFA', label: '浅蓝紫' },
  ],
};

const THEMES: { key: StyleTheme; name: string; dot: string; icon: string }[] = [
  { key: 'google', name: 'Google', dot: '#4285F4', icon: 'G' },
  { key: 'amazon', name: 'Amazon', dot: '#FF9900', icon: 'A' },
  { key: 'microsoft', name: 'Microsoft', dot: '#0078D4', icon: 'M' },
  { key: 'deloitte', name: 'Deloitte', dot: '#86BC25', icon: 'D' },
  { key: 'pwc', name: 'PwC', dot: '#D04A02', icon: 'P' },
  { key: 'brand', name: '自定义', dot: '#7C3AED', icon: '✦' },
  { key: 'haio', name: 'Haio', dot: '#2563EB', icon: 'H' },
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
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [previewStatus, setPreviewStatus] = useState('');
  const [progressPhase, setProgressPhase] = useState('');
  const [slidesDone, setSlidesDone] = useState(0);
  // Outline state
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [researchId, setResearchId] = useState('');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineResearch, setOutlineResearch] = useState<PreviewResponse['research']>(undefined);
  // D3: Language
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  // History for undo
  const [history, setHistory] = useState<PreviewResponse[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  // URL input
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const palette = THEME_PALETTES[theme][paletteIdx] || THEME_PALETTES[theme][0];
  const currentTheme: ThemeConfig = { ...themes[theme], primary: palette.primary, accent: palette.accent };

  // D1: Push to history on preview data change
  const pushHistory = (data: PreviewResponse) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };
  const undo = () => { if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setPreviewData(history[historyIdx - 1]); } };
  const redo = () => { if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setPreviewData(history[historyIdx + 1]); } };

  // A1: Generate outline first
  const handleOutline = async () => {
    if (!topic.trim()) return;
    setOutlineLoading(true); setOutline(null); setPreviewData(null);
    try {
      const res = await fetch('/api/outline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description: description + (lang === 'en' ? '\n\n[LANGUAGE: Generate all content in English]' : ''), pageCount, theme, scenes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '大纲生成失败');
      const data = await res.json();
      setOutline(data.outline);
      setResearchId(data.researchId);
      setOutlineResearch(data.research);
    } catch (e) { alert((e as Error).message); }
    finally { setOutlineLoading(false); }
  };

  // A3: Generate from confirmed outline
  const handlePreview = async () => {
    if (!topic.trim()) return;
    setPreviewing(true); setPreviewData(null); setActiveSlide(0);
    setPreviewStatus('搜索数据中...'); setProgressPhase('research'); setSlidesDone(0);
    try {
      const res = await fetch('/api/preview-stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description: description + (lang === 'en' ? '\n\n[LANGUAGE: Generate all content in English]' : ''), pageCount, theme, scenes, outline, researchId }),
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
            } else if (eventType === 'done') { setPreviewData({ ...data, research: streamResearch }); setProgressPhase('done'); pushHistory({ ...data, research: streamResearch }); }
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
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md" style={{ borderColor: 'var(--border-0)' }}>
        <div className="max-w-[1280px] mx-auto h-13 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm" style={{ background: '#7C3AED' }}>G</div>
            <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--text-0)' }}>Gammer</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>v0.0.01</span>
          </div>
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-2)' }}>AI Presentation Engine</span>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium mb-2" style={{ color: 'var(--text-0)' }}>
              {Icon.file} 演示主题
            </label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="例如：2024年Q3技术架构升级方案"
              className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition-all"
              style={{ background: 'var(--bg-1)', border: '1.5px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-0)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium mb-2" style={{ color: 'var(--text-0)' }}>
              {Icon.edit} 详细描述
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="核心论点、关键数据、期望结论"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none transition-all"
              style={{ background: 'var(--bg-1)', border: '1.5px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-0)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Scenes */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium mb-2.5" style={{ color: 'var(--text-0)' }}>
              {Icon.layers} 汇报场景
            </label>
            <div className="flex flex-wrap gap-2">
              {SCENES.map(s => {
                const active = scenes.includes(s);
                return (
                  <button key={s}
                    onClick={() => active ? setScenes(p => p.split(/[,，]/).filter(x => x.trim() !== s).join('，')) : setScenes(p => p ? `${p}，${s}` : s)}
                    className="h-8 px-3.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: active ? 'var(--accent-light)' : 'var(--bg-1)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-0)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-1)',
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages + Theme + Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Page count + Language */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)' }}>
              <label className="flex items-center gap-1.5 text-[13px] font-medium mb-3" style={{ color: 'var(--text-0)' }}>
                {Icon.file} 页数
              </label>
              <div className="flex gap-1.5 mb-3">
                {PAGE_OPTIONS.map(n => (
                  <button key={n} onClick={() => { setPageCount(n); setPreviewData(null); }}
                    className="flex-1 h-9 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      background: pageCount === n ? palette.primary : 'var(--bg-0)',
                      color: pageCount === n ? '#fff' : 'var(--text-1)',
                      border: pageCount === n ? 'none' : '1px solid var(--border-0)',
                      boxShadow: pageCount === n ? `0 2px 8px ${palette.primary}30` : 'none',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              {/* D3: Language toggle */}
              <div className="flex gap-1.5">
                {(['zh', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: lang === l ? `${palette.primary}12` : 'var(--bg-0)',
                      border: lang === l ? `1.5px solid ${palette.primary}` : '1px solid var(--border-0)',
                      color: lang === l ? palette.primary : 'var(--text-2)',
                    }}>
                    {l === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)' }}>
              <label className="flex items-center gap-1.5 text-[13px] font-medium mb-3" style={{ color: 'var(--text-0)' }}>
                {Icon.palette} 设计风格
              </label>
              <div className="flex gap-1.5 mb-3">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => { setTheme(t.key); setPaletteIdx(0); }} title={t.name}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all"
                    style={{
                      border: theme === t.key ? `2px solid ${t.dot}` : '1.5px solid var(--border-0)',
                      background: theme === t.key ? `${t.dot}12` : 'var(--bg-0)',
                      color: theme === t.key ? t.dot : 'var(--text-2)',
                      boxShadow: theme === t.key ? `0 0 0 3px ${t.dot}15` : 'none',
                    }}>
                    {t.icon}
                  </button>
                ))}
              </div>

              {/* Color palette: 5 options per theme */}
              <div className="flex gap-1.5">
                {THEME_PALETTES[theme].map((p, i) => (
                  <button key={i} onClick={() => setPaletteIdx(i)} title={p.label}
                    className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1 transition-all"
                    style={{
                      border: paletteIdx === i ? `2px solid ${p.primary}` : '1px solid var(--border-0)',
                      background: paletteIdx === i ? `${p.primary}08` : 'var(--bg-0)',
                      boxShadow: paletteIdx === i ? `0 1px 4px ${p.primary}20` : 'none',
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: p.accent }} />
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-2)' }}>
                {palette.label} · 主色 + 强调色
              </p>
            </div>
          </div>

          {/* D2: URL input */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium mb-2" style={{ color: 'var(--text-0)' }}>
              {Icon.layers} 参考链接
            </label>
            <div className="flex gap-2">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="粘贴 URL，自动提取内容作为参考"
                className="flex-1 h-11 px-4 rounded-xl text-[14px] outline-none transition-all"
                style={{ background: 'var(--bg-1)', border: '1.5px solid var(--border-0)', color: 'var(--text-0)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-0)'; e.target.style.boxShadow = 'none'; }} />
              <button onClick={async () => {
                if (!urlInput.trim() || urlLoading) return;
                setUrlLoading(true);
                try {
                  const res = await fetch(urlInput);
                  const html = await res.text();
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  const text = (doc.querySelector('article') || doc.body).textContent?.slice(0, 2000) || '';
                  setDescription(prev => prev ? `${prev}\n\n参考内容：${text}` : `参考内容：${text}`);
                  setUrlInput('');
                } catch { alert('URL 提取失败'); }
                finally { setUrlLoading(false); }
              }} disabled={!urlInput.trim() || urlLoading}
                className="h-11 px-4 rounded-xl text-[13px] font-medium text-white disabled:opacity-30"
                style={{ background: palette.primary }}>
                {urlLoading ? '...' : '提取'}
              </button>
            </div>
          </div>

          {/* Actions: 3-step flow */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleOutline} disabled={!topic.trim() || busy || outlineLoading}
              className="flex-1 h-12 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-0)', border: '1.5px solid var(--border-1)', color: 'var(--text-0)' }}>
              {Icon.search}
              {outlineLoading ? <span className="animate-pulse-slow">生成大纲中...</span> : '生成大纲'}
            </button>
            <button onClick={handlePreview} disabled={!topic.trim() || busy || !outline}
              className="flex-1 h-12 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-0)', border: `1.5px solid ${outline ? palette.primary : 'var(--border-0)'}`, color: outline ? palette.primary : 'var(--text-2)' }}>
              {previewing ? <span className="animate-pulse-slow">{previewStatus || '处理中...'}</span> : '确认生成'}
            </button>
            <button onClick={handleGenerate} disabled={!topic.trim() || busy || !previewData}
              className="flex-1 h-12 rounded-xl text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: previewData ? palette.primary : 'var(--text-2)', boxShadow: previewData ? `0 4px 14px ${palette.primary}30` : 'none' }}>
              {Icon.download}
              {loading ? <span className="animate-pulse-slow">生成中...</span> : '下载 PPTX'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl p-5" style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)' }}>
            {previewing && <Progress phase={progressPhase} done={slidesDone} total={pageCount} accent={palette.primary} />}
            {previewData ? (
              <PreviewPanel data={previewData} active={activeSlide} setActive={setActiveSlide}
                theme={currentTheme} themeKey={theme} loading={loading} onGenerate={handleGenerate} busy={busy} accent={palette.primary}
                onSlideUpdate={(i, sl) => { const u = { ...previewData, slides: [...previewData.slides] }; u.slides[i] = sl; setPreviewData(u); pushHistory(u); }}
                onSlidesReplace={sl => { const u = { ...previewData, slides: sl }; setPreviewData(u); pushHistory(u); }}
                canUndo={historyIdx > 0} canRedo={historyIdx < history.length - 1} onUndo={undo} onRedo={redo} />
            ) : outline && !previewing ? (
              <OutlineEditor outline={outline} setOutline={setOutline} accent={palette.primary} research={outlineResearch} />
            ) : !previewing ? (
              <Structure layouts={layoutPresets[pageCount]} theme={currentTheme} count={pageCount} accent={palette.primary} />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Progress ── */
const STEPS = ['搜索', '生成', '检查', '优化'];

function Progress({ phase, done, total, accent }: { phase: string; done: number; total: number; accent: string }) {
  const map: Record<string, number> = { research: 0, generating: 1, checking: 2, optimizing: 3, done: 4 };
  const idx = map[phase] ?? 0;
  const pct = phase === 'generating' ? 15 + Math.round((done / Math.max(total, 1)) * 60) :
    phase === 'checking' ? 80 : phase === 'optimizing' ? 90 : phase === 'done' ? 100 : 8;

  return (
    <div className="mb-5">
      <div className="flex gap-3 mb-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{
                background: idx > i ? 'var(--success)' : idx === i ? accent : 'var(--bg-2)',
                color: idx >= i ? '#fff' : 'var(--text-2)',
              }}>
              {idx > i ? '✓' : i + 1}
            </div>
            <span className="text-[11px] font-medium" style={{ color: idx === i ? 'var(--text-0)' : 'var(--text-2)' }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px]" style={{ color: 'var(--text-1)' }}>
          {phase === 'generating' && done > 0 ? `${done} / ${total} 页` : STEPS[idx] || '准备中'}
        </span>
        <span className="text-[11px] tabular-nums font-medium" style={{ color: accent }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── Preview Panel ── */
function PreviewPanel({ data, active, setActive, theme, themeKey, loading, onGenerate, busy, onSlideUpdate, onSlidesReplace, accent, canUndo, canRedo, onUndo, onRedo }: {
  data: PreviewResponse; active: number; setActive: (n: number) => void;
  theme: ThemeConfig; themeKey: StyleTheme; loading: boolean; onGenerate: () => void; busy: boolean; accent: string;
  onSlideUpdate: (i: number, s: SlideContent) => void; onSlidesReplace: (s: SlideContent[]) => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
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

  const inputCls = "flex-1 h-9 px-3 rounded-lg text-[12px] outline-none transition-all";
  const inputSt = { background: 'var(--bg-0)', border: '1.5px solid var(--border-0)', color: 'var(--text-0)' };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold flex-1" style={{ color: 'var(--text-0)' }}>内容预览</span>
        {/* D1: Undo/Redo */}
        <button onClick={onUndo} disabled={!canUndo} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ border: '1px solid var(--border-0)' }} title="撤销">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ border: '1px solid var(--border-0)' }} title="重做">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
        {score > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: score >= 80 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2',
              color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--err)' }}>
            {score}分
          </span>
        )}
        <span className="text-[11px] tabular-nums font-medium" style={{ color: 'var(--text-2)' }}>{active + 1}/{slides.length}</span>
      </div>

      {research?.summary && (
        <div className="mb-3 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: `${accent}06`, border: `1px solid ${accent}15`, color: 'var(--text-1)' }}>
          {research.summary}
          {research.keyStats?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {research.keyStats.slice(0, 3).map((st, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'var(--bg-0)', color: accent }}>{st.metric} {st.value}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl text-[10px]" style={{ background: '#FFFBEB' }}>
          {issues.slice(0, 3).map((iss, i) => (
            <p key={i} style={{ color: 'var(--warn)' }}>P{iss.page}: {iss.issue}</p>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5">
        {slides.map((sl, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="shrink-0 w-10 h-7 rounded-lg text-[9px] font-semibold flex items-center justify-center transition-all"
            style={{
              background: i === active ? accent : 'var(--bg-0)',
              color: i === active ? '#fff' : 'var(--text-2)',
              border: i === active ? 'none' : '1px solid var(--border-0)',
              boxShadow: i === active ? `0 2px 6px ${accent}30` : 'none',
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      {s && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>
              {TYPE_LABEL[s.type] || s.type} · {s.layout || 'full-text'}
            </span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-0)', aspectRatio: '16/9' }}>
            <SlideRenderer slide={s} theme={theme} themeKey={themeKey} pageNum={active + 1} total={slides.length} />
          </div>
          {s.notes && <p className="mt-2 text-[10px] italic" style={{ color: 'var(--text-2)' }}>{s.notes}</p>}
          {/* C2: Source provenance badge */}
          {s.source && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: s.sourceType === 'official' ? '#ECFDF5' : s.sourceType === 'research' ? '#EFF6FF' : '#FFFBEB',
                  color: s.sourceType === 'official' ? 'var(--success)' : s.sourceType === 'research' ? '#2563EB' : 'var(--warn)',
                }}>
                {s.sourceType === 'official' ? '权威来源' : s.sourceType === 'research' ? '研究数据' : 'AI 推断'}
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-2)' }}>{s.source}</span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="flex gap-2 mt-3">
        <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
          className="flex-1 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
          style={{ border: '1px solid var(--border-0)', color: 'var(--text-1)', background: 'var(--bg-0)' }}>
          {Icon.left}
        </button>
        <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1}
          className="flex-1 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
          style={{ border: '1px solid var(--border-0)', color: 'var(--text-1)', background: 'var(--bg-0)' }}>
          {Icon.right}
        </button>
      </div>

      {/* Edit: single */}
      <div className="mt-3 flex gap-1.5">
        <input type="text" value={retryInput} onChange={e => setRetryInput(e.target.value)}
          placeholder="修改本页..." onKeyDown={e => e.key === 'Enter' && handleRetry()}
          className={inputCls} style={inputSt} />
        <button onClick={handleRetry} disabled={!retryInput.trim() || retrying}
          className="h-9 px-3 rounded-lg text-[12px] font-medium text-white flex items-center gap-1 disabled:opacity-30"
          style={{ background: accent }}>
          {Icon.refresh} {retrying ? '...' : '重试'}
        </button>
      </div>

      {/* Edit: global */}
      <div className="mt-1.5 flex gap-1.5">
        <input type="text" value={globalInput} onChange={e => setGlobalInput(e.target.value)}
          placeholder="全局修改..." onKeyDown={e => e.key === 'Enter' && handleGlobalEdit()}
          className={inputCls} style={inputSt} />
        <button onClick={handleGlobalEdit} disabled={!globalInput.trim() || globalEditing}
          className="h-9 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1 disabled:opacity-30"
          style={{ border: `1.5px solid ${accent}`, color: accent, background: 'var(--bg-0)' }}>
          {Icon.edit} {globalEditing ? '...' : '编辑'}
        </button>
      </div>

      <button onClick={onGenerate} disabled={busy}
        className="w-full mt-3 h-11 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-30"
        style={{ background: accent, boxShadow: `0 4px 14px ${accent}25` }}>
        {Icon.download} {loading ? '生成中...' : '下载 PPTX'}
      </button>
    </>
  );
}

/* ── Outline Editor ── */
function OutlineEditor({ outline, setOutline, accent, research }: {
  outline: OutlineItem[]; setOutline: (o: OutlineItem[]) => void; accent: string;
  research?: PreviewResponse['research'];
}) {
  const update = (idx: number, field: keyof OutlineItem, value: string | string[]) => {
    const next = [...outline];
    next[idx] = { ...next[idx], [field]: value };
    setOutline(next);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...outline];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOutline(next);
  };
  const remove = (idx: number) => { if (outline.length > 3) setOutline(outline.filter((_, i) => i !== idx)); };
  const add = (idx: number) => {
    const next = [...outline];
    next.splice(idx + 1, 0, { title: '新页面', bullets: ['要点1'], type: 'content', layout: 'full-text' });
    setOutline(next);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>大纲编辑</span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>{outline.length} 页</span>
      </div>

      {research?.summary && (
        <div className="mb-3 p-2.5 rounded-lg text-[10px] leading-relaxed" style={{ background: `${accent}06`, border: `1px solid ${accent}15`, color: 'var(--text-1)' }}>
          {research.summary.slice(0, 150)}...
        </div>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {outline.map((item, i) => (
          <div key={i} className="p-3 rounded-xl transition-all" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center text-white" style={{ background: accent }}>{i + 1}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>{item.type}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>{item.layout}</span>
              <div className="flex-1" />
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] px-1 disabled:opacity-20" style={{ color: accent }}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === outline.length - 1} className="text-[10px] px-1 disabled:opacity-20" style={{ color: accent }}>↓</button>
              <button onClick={() => add(i)} className="text-[10px] px-1" style={{ color: 'var(--success)' }}>+</button>
              <button onClick={() => remove(i)} disabled={outline.length <= 3} className="text-[10px] px-1 disabled:opacity-20" style={{ color: 'var(--err)' }}>×</button>
            </div>
            <input value={item.title} onChange={e => update(i, 'title', e.target.value)}
              className="w-full text-[12px] font-medium px-2 py-1 rounded outline-none mb-1"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }} />
            {item.bullets.map((b, j) => (
              <div key={j} className="flex gap-1 mb-0.5">
                <span className="text-[9px] mt-1" style={{ color: accent }}>•</span>
                <input value={b} onChange={e => {
                  const newBullets = [...item.bullets]; newBullets[j] = e.target.value;
                  update(i, 'bullets', newBullets);
                }}
                  className="flex-1 text-[11px] px-1.5 py-0.5 rounded outline-none"
                  style={{ background: 'var(--bg-1)', color: 'var(--text-1)' }} />
                <button onClick={() => update(i, 'bullets', item.bullets.filter((_, k) => k !== j))}
                  className="text-[9px] px-1" style={{ color: 'var(--text-2)' }}>×</button>
              </div>
            ))}
            <button onClick={() => update(i, 'bullets', [...item.bullets, '新要点'])}
              className="text-[9px] mt-0.5" style={{ color: accent }}>+ 添加要点</button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--text-2)' }}>
        编辑大纲后点击「确认生成」，AI 将根据调整后的大纲重新检索数据并生成内容。
      </p>
    </>
  );
}

/* ── Structure Preview ── */
function Structure({ layouts, theme, count, accent }: {
  layouts: { type: string; label: string }[]; theme: ThemeConfig; count: number; accent: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>页面结构</span>
        <span className="text-[11px] tabular-nums font-medium" style={{ color: 'var(--text-2)' }}>{count} 页</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout, i) => (
          <div key={i} className="slide-mini" style={{ background: i === 0 ? accent : 'var(--bg-0)' }}>
            <div className="p-1.5 h-full flex flex-col">
              {i === 0 ? (
                <><div className="w-3/4 h-[2px] bg-white/70 rounded mb-0.5" /><div className="w-1/2 h-[2px] bg-white/40 rounded" /></>
              ) : (
                <><div className="w-2/3 h-[2px] rounded mb-0.5" style={{ background: accent }} /><div className="w-full h-[1px] rounded mb-0.5" style={{ background: 'var(--border-0)' }} /><div className="w-4/5 h-[1px] rounded" style={{ background: 'var(--border-0)' }} /></>
              )}
            </div>
            <div className="slide-label">{layout.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
        点击「预览内容」生成咨询级内容，确认后下载 PPTX。
      </p>
    </>
  );
}
