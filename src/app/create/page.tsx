'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { PageCount, StyleTheme, SlideContent, ThemeConfig, OutlineItem } from '@/lib/types';
import { layoutPresets } from '@/lib/layouts';
import { templates } from '@/data/templates';
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

// Per-theme color palettes: 1主色+3辅助色，商务风低饱和
const THEME_PALETTES: Record<StyleTheme, { primary: string; accent: string; label: string }[]> = {
  google: [
    { primary: '#1A3C6E', accent: '#2E7DB5', label: '藏青蓝' },
    { primary: '#1E4D8C', accent: '#3B82B0', label: '深蓝' },
    { primary: '#2C5282', accent: '#C8963E', label: '蓝金搭' },
    { primary: '#1A3C6E', accent: '#2D8B6F', label: '蓝绿搭' },
    { primary: '#2B4C7E', accent: '#6B7280', label: '蓝灰搭' },
  ],
  amazon: [
    { primary: '#1B2A4A', accent: '#C8963E', label: '藏青金' },
    { primary: '#1F3352', accent: '#B8860B', label: '深蓝暗金' },
    { primary: '#2C3E50', accent: '#2A7AB5', label: '蓝青搭' },
    { primary: '#1B2A4A', accent: '#6B7280', label: '藏青灰' },
    { primary: '#34495E', accent: '#8B6914', label: '灰金搭' },
  ],
  microsoft: [
    { primary: '#1E3A5F', accent: '#3B82B0', label: '深蓝' },
    { primary: '#1A3C6E', accent: '#C8963E', label: '蓝金搭' },
    { primary: '#2C5282', accent: '#6E7B8B', label: '蓝灰搭' },
    { primary: '#1E3A5F', accent: '#2D8B6F', label: '蓝绿搭' },
    { primary: '#34495E', accent: '#3B82B0', label: '灰蓝搭' },
  ],
  deloitte: [
    { primary: '#1A3C34', accent: '#5B8C3E', label: '墨绿' },
    { primary: '#1A3C34', accent: '#C8963E', label: '绿金搭' },
    { primary: '#2D5A4E', accent: '#2A7AB5', label: '绿蓝搭' },
    { primary: '#1A3C34', accent: '#6B7280', label: '绿灰搭' },
    { primary: '#2E4A3E', accent: '#5B8C3E', label: '深绿' },
  ],
  pwc: [
    { primary: '#4A2C1A', accent: '#B8860B', label: '棕金搭' },
    { primary: '#3E2723', accent: '#C8963E', label: '深棕金' },
    { primary: '#4A2C1A', accent: '#2A7AB5', label: '棕蓝搭' },
    { primary: '#5D4037', accent: '#6B7280', label: '棕灰搭' },
    { primary: '#4A2C1A', accent: '#8B6914', label: '暖金搭' },
  ],
  brand: [
    { primary: '#2D1B69', accent: '#6C5CE7', label: '深紫' },
    { primary: '#2D1B69', accent: '#C8963E', label: '紫金搭' },
    { primary: '#3B2D7E', accent: '#2A7AB5', label: '紫蓝搭' },
    { primary: '#2D1B69', accent: '#6B7280', label: '紫灰搭' },
    { primary: '#4A3B8C', accent: '#2D8B6F', label: '紫绿搭' },
  ],
  haio: [
    { primary: '#0F2B46', accent: '#2A7AB5', label: '极深蓝' },
    { primary: '#0F2B46', accent: '#C8963E', label: '深蓝金' },
    { primary: '#1A3C5E', accent: '#6B7280', label: '蓝灰搭' },
    { primary: '#0F2B46', accent: '#2D8B6F', label: '蓝绿搭' },
    { primary: '#1E3A5F', accent: '#2A7AB5', label: '商务蓝' },
  ],
};

const THEMES: { key: StyleTheme; name: string; dot: string; icon: string }[] = [
  { key: 'google', name: '经典蓝', dot: '#1A3C6E', icon: 'G' },
  { key: 'amazon', name: '藏青', dot: '#1B2A4A', icon: 'A' },
  { key: 'microsoft', name: '专业蓝', dot: '#1E3A5F', icon: 'M' },
  { key: 'deloitte', name: '咨询绿', dot: '#1A3C34', icon: 'D' },
  { key: 'pwc', name: '暖色', dot: '#4A2C1A', icon: 'P' },
  { key: 'brand', name: '品牌', dot: '#2D1B69', icon: '✦' },
  { key: 'haio', name: '极简', dot: '#0F2B46', icon: 'H' },
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

import { Suspense } from 'react';

export default function CreatePage() {
  return <Suspense><HomeInner /></Suspense>;
}

function HomeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initTopic = searchParams.get('topic') || '';
  const initScene = searchParams.get('scene') || '';
  const matchedTemplate = templates.find(t => t.id === initScene);
  const [topic, setTopic] = useState(initTopic);
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState<PageCount>(matchedTemplate?.defaultPageCount || 10);
  const [theme, setTheme] = useState<StyleTheme>(matchedTemplate?.defaultTheme || 'brand');
  const [scenes, setScenes] = useState(matchedTemplate?.name || '');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [previewStatus, setPreviewStatus] = useState('');
  const [progressPhase, setProgressPhase] = useState('');
  const [slidesDone, setSlidesDone] = useState(0);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
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
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push(data);
      setHistoryIdx(newHistory.length - 1);
      return newHistory;
    });
  };
  const undo = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setPreviewData(history[newIdx]);
    }
  };
  const redo = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setPreviewData(history[newIdx]);
    }
  };

  // A1: Generate outline first
  const handleOutline = async () => {
    if (!topic.trim()) return;
    setOutlineLoading(true); setOutline(null); setPreviewData(null);
    try {
      const res = await fetch('/api/outline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description: description + (lang === 'en' ? '\n\n[LANGUAGE: Generate all content in English]' : ''), pageCount, theme, scenes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `大纲生成失败 (${res.status})`);
      }
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
    setPreviewStatus('搜索数据中...'); setProgressPhase('research'); setSlidesDone(0); setTaskLogs([]);
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
            } else if (eventType === 'done') {
              setPreviewData({ ...data, research: streamResearch }); setProgressPhase('done'); pushHistory({ ...data, research: streamResearch });
              // Auto-save to database
              try {
                const res = await fetch('/api/projects', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: topic, description, theme, paletteIdx, pageCount, lang, scenes, slides: data.slides, outline, research: streamResearch, score: data.score }),
                });
                if (res.ok) {
                  const { id } = await res.json();
                  if (id) setTimeout(() => router.push(`/edit/${id}`), 1500);
                }
              } catch {}
            }
            else if (eventType === 'error') { throw new Error(data.message); }
            else if (eventType === 'log') { setTaskLogs(prev => [...prev, data.text]); }
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

  const busy = loading || previewing || outlineLoading;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const hasContent = !!(previewData || outline || outlineLoading || previewing);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-30 border-b bg-white" style={{ borderColor: 'var(--border-0)' }}>
        <div className="h-12 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" title={sidebarOpen ? '收起面板' : '展开面板'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-extrabold text-xs" style={{ background: '#7C3AED' }}>G</div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Gammer</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>v0.0.01</span>
          </div>
          <div className="flex items-center gap-2">
            {previewData && <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>{activeSlide + 1} / {previewData.slides.length}</span>}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collapsible Sidebar */}
        <div className={`shrink-0 border-r overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}`} style={{ borderColor: 'var(--border-0)', background: 'var(--bg-0)' }}>
          <div className="w-[400px] px-6 py-5 space-y-5">
          {/* Topic */}
          <div>
            <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--text-1)' }}>演示主题</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="例如：2024年Q3技术架构升级方案"
              className="w-full h-10 px-3.5 rounded-lg text-[14px] outline-none transition-all"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-0)'; }} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--text-1)' }}>详细描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="核心论点、关键数据、期望结论"
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg text-[14px] outline-none resize-none transition-all"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-0)'; }} />
          </div>

          {/* Scenes */}
          <div>
            <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>汇报场景</label>
            <div className="flex flex-wrap gap-1.5">
              {SCENES.map(s => {
                const active = scenes.includes(s);
                return (
                  <button key={s}
                    onClick={() => active ? setScenes(p => p.split(/[,，]/).filter(x => x.trim() !== s).join('，')) : setScenes(p => p ? `${p}，${s}` : s)}
                    className="h-7 px-3 rounded-md text-[12px] font-medium transition-all"
                    style={{
                      background: active ? 'var(--accent-light)' : 'var(--bg-1)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border-0)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages + Theme */}
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>页数</label>
              <div className="flex gap-1.5">
                {PAGE_OPTIONS.map(n => (
                  <button key={n} onClick={() => { setPageCount(n); setPreviewData(null); setOutline(null); }}
                    className="flex-1 h-9 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      background: pageCount === n ? palette.primary : 'var(--bg-1)',
                      color: pageCount === n ? '#fff' : 'var(--text-2)',
                      border: pageCount === n ? 'none' : '1px solid var(--border-0)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                {(['zh', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: lang === l ? `${palette.primary}12` : 'var(--bg-1)',
                      border: lang === l ? `1px solid ${palette.primary}` : '1px solid var(--border-0)',
                      color: lang === l ? palette.primary : 'var(--text-2)',
                    }}>
                    {l === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium mb-2 block" style={{ color: 'var(--text-1)' }}>设计风格</label>
              <div className="flex gap-1.5 mb-2">
                {THEMES.map(t => (
                  <button key={t.key} onClick={() => { setTheme(t.key); setPaletteIdx(0); }} title={t.name}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all"
                    style={{
                      border: theme === t.key ? `2px solid ${t.dot}` : '1px solid var(--border-0)',
                      background: theme === t.key ? `${t.dot}12` : 'var(--bg-1)',
                      color: theme === t.key ? t.dot : 'var(--text-2)',
                    }}>
                    {t.icon}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {THEME_PALETTES[theme].map((p, i) => (
                  <button key={i} onClick={() => setPaletteIdx(i)} title={p.label}
                    className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1 transition-all"
                    style={{
                      border: paletteIdx === i ? `1.5px solid ${p.primary}` : '1px solid var(--border-0)',
                      background: paletteIdx === i ? `${p.primary}08` : 'var(--bg-1)',
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: p.accent }} />
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-1.5 text-center" style={{ color: 'var(--text-2)' }}>{palette.label}</p>
            </div>
          </div>

          {/* URL input */}
          <div>
            <label className="text-[13px] font-medium mb-1.5 block" style={{ color: 'var(--text-1)' }}>参考链接</label>
            <div className="flex gap-1.5">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="粘贴 URL（多个用逗号分隔）"
                className="flex-1 h-10 px-3.5 rounded-lg text-[13px] outline-none"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }} />
              <button onClick={async () => {
                if (!urlInput.trim() || urlLoading) return;
                setUrlLoading(true);
                try {
                  const urls = urlInput.split(/[,，]/).map(u => u.trim()).filter(Boolean);
                  const res = await fetch('/api/fetch-url', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls, topic }),
                  });
                  const { summary, texts } = await res.json();
                  if (summary) {
                    setDescription(prev => prev ? `${prev}\n\n${summary}` : summary);
                    setUrlInput('');
                  } else if (texts?.length) {
                    setDescription(prev => prev ? `${prev}\n\n参考内容：${texts[0].slice(0, 500)}` : `参考内容：${texts[0].slice(0, 500)}`);
                    setUrlInput('');
                  } else { alert('未能提取到内容'); }
                } catch { alert('URL 提取失败'); }
                finally { setUrlLoading(false); }
              }} disabled={!urlInput.trim() || urlLoading}
                className="h-10 px-4 rounded-lg text-[12px] font-medium text-white disabled:opacity-30"
                style={{ background: palette.primary }}>
                {urlLoading ? '...' : '提取'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-3">
            <button onClick={handleOutline} disabled={!topic.trim() || busy}
              className="w-full h-11 rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', color: 'var(--text-0)' }}>
              {Icon.search}
              {outlineLoading ? <span className="animate-pulse-slow">大纲生成中...</span> : '生成大纲'}
            </button>
            <button onClick={handlePreview} disabled={!topic.trim() || busy || !outline}
              className="w-full h-11 rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-1)', border: `1px solid ${outline ? palette.primary : 'var(--border-0)'}`, color: outline ? palette.primary : 'var(--text-2)' }}>
              {previewing ? <span className="animate-pulse-slow">{previewStatus || '处理中...'}</span> : '确认生成'}
            </button>
            <button onClick={handleGenerate} disabled={!topic.trim() || busy || !previewData}
              className="w-full h-11 rounded-lg text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              style={{ background: previewData ? palette.primary : 'var(--text-2)' }}>
              {Icon.download}
              {loading ? <span className="animate-pulse-slow">生成中...</span> : '下载 PPTX'}
            </button>
          </div>
        </div>
        </div>

        {/* Main: Full-width content area */}
        <div className="flex-1 min-w-0 overflow-y-auto slide-gallery px-10" style={{ background: 'var(--bg-1)' }}>
          {(outlineLoading || previewing) && (
            <div className="max-w-[720px] mx-auto px-6 pt-6">
              <Progress phase={outlineLoading ? 'outline' : progressPhase} done={slidesDone} total={pageCount} accent={palette.primary} />
              {/* Task log panel */}
              {taskLogs.length > 0 && (
                <div className="mt-2 p-3 rounded-xl max-h-[200px] overflow-y-auto" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-1)' }}>处理详情</span>
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-2)' }}>{taskLogs.length} 条</span>
                  </div>
                  <div className="space-y-0.5">
                    {taskLogs.map((log, i) => (
                      <p key={i} className="text-[11px] leading-relaxed" style={{ color: i === taskLogs.length - 1 ? 'var(--text-0)' : 'var(--text-2)' }}>{log}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {previewData ? (
            <SlideGallery data={previewData} active={activeSlide} setActive={setActiveSlide}
              theme={currentTheme} themeKey={theme} loading={loading} onGenerate={handleGenerate} busy={busy} accent={palette.primary}
              onSlideUpdate={(i, sl) => { const u = { ...previewData, slides: [...previewData.slides] }; u.slides[i] = sl; setPreviewData(u); pushHistory(u); }}
              onSlidesReplace={sl => { const u = { ...previewData, slides: sl }; setPreviewData(u); pushHistory(u); }}
              canUndo={historyIdx > 0} canRedo={historyIdx < history.length - 1} onUndo={undo} onRedo={redo} />
          ) : outline && !outlineLoading && !previewing ? (
            <div className="h-full px-8 py-6">
              <OutlineEditor outline={outline} setOutline={setOutline} accent={palette.primary} research={outlineResearch} />
            </div>
          ) : !hasContent ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-6" style={{ background: '#7C3AED' }}>G</div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-0)' }}>开始创建演示文稿</h2>
                <p className="text-[13px] mb-6" style={{ color: 'var(--text-2)' }}>在左侧输入主题，点击「生成大纲」开始</p>
                <div className="grid grid-cols-3 gap-3">
                  {layoutPresets[pageCount].slice(0, 6).map((layout, i) => (
                    <div key={i} className="slide-mini" style={{ background: i === 0 ? palette.primary : 'var(--bg-0)' }}>
                      <div className="p-1.5 h-full flex flex-col">
                        {i === 0 ? (
                          <><div className="w-3/4 h-[2px] bg-white/70 rounded mb-0.5" /><div className="w-1/2 h-[2px] bg-white/40 rounded" /></>
                        ) : (
                          <><div className="w-2/3 h-[2px] rounded mb-0.5" style={{ background: palette.primary }} /><div className="w-full h-[1px] rounded mb-0.5" style={{ background: 'var(--border-0)' }} /><div className="w-4/5 h-[1px] rounded" style={{ background: 'var(--border-0)' }} /></>
                        )}
                      </div>
                      <div className="slide-label">{layout.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Progress ── */
const STEPS = ['搜索', '大纲', '生成', '检查', '优化'];
const STEP_ICONS = ['🔍', '📋', '✍️', '✅', '⚡'];

function Progress({ phase, done, total, accent }: { phase: string; done: number; total: number; accent: string }) {
  const map: Record<string, number> = { outline: 0, research: 1, generating: 2, checking: 3, optimizing: 4, done: 5 };
  const idx = map[phase] ?? 0;
  const pct = phase === 'outline' ? 5
    : phase === 'research' ? 15
    : phase === 'generating' ? 20 + Math.round((done / Math.max(total, 1)) * 55)
    : phase === 'checking' ? 80 : phase === 'optimizing' ? 90 : phase === 'done' ? 100 : 3;

  return (
    <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)' }}>
      {/* Step indicators with connecting lines */}
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ${idx === i ? 'step-active' : ''}`}
                style={{
                  background: idx > i ? 'var(--success)' : idx === i ? accent : 'var(--bg-2)',
                  color: idx >= i ? '#fff' : 'var(--text-2)',
                  border: idx === i ? `2px solid ${accent}` : 'none',
                }}>
                {idx > i ? '✓' : STEP_ICONS[i]}
              </div>
              <span className="text-[10px] font-medium" style={{ color: idx === i ? accent : idx > i ? 'var(--success)' : 'var(--text-2)' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 rounded-full transition-all duration-500" style={{ background: idx > i ? 'var(--success)' : 'var(--bg-3)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Animated progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out progress-bar-animated"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}CC, ${accent})`,
          }}
        />
      </div>

      {/* Status text */}
      <div className="flex justify-between mt-2">
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-0)' }}>
          {phase === 'generating' && done > 0
            ? `正在生成第 ${done + 1} 页（共 ${total} 页）`
            : phase === 'outline' ? '正在生成大纲...'
            : phase === 'research' ? '正在搜索权威数据源...'
            : phase === 'checking' ? '正在检查内容质量...'
            : phase === 'optimizing' ? '正在优化内容...'
            : phase === 'done' ? '生成完成！'
            : '准备中...'}
        </span>
        <span className="text-[12px] tabular-nums font-semibold" style={{ color: accent }}>{pct}%</span>
      </div>

      {/* Slide count pills during generation */}
      {phase === 'generating' && done > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className="w-6 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i < done ? accent : 'var(--bg-3)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Slide Gallery: Full-width vertical scroll ── */
function SlideGallery({ data, active, setActive, theme, themeKey, loading, onGenerate, busy, onSlideUpdate, onSlidesReplace, accent, canUndo, canRedo, onUndo, onRedo }: {
  data: PreviewResponse; active: number; setActive: (n: number) => void;
  theme: ThemeConfig; themeKey: StyleTheme; loading: boolean; onGenerate: () => void; busy: boolean; accent: string;
  onSlideUpdate: (i: number, s: SlideContent) => void; onSlidesReplace: (s: SlideContent[]) => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
}) {
  const { slides, issues, score, research } = data;
  const [retryInput, setRetryInput] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [globalInput, setGlobalInput] = useState('');
  const [globalEditing, setGlobalEditing] = useState(false);
  const [zoomed, setZoomed] = useState(false);

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

  return (
    <div className="px-6 py-6">
      {/* Toolbar */}
      <div className="max-w-[900px] mx-auto flex items-center gap-2 mb-4">
        <span className="text-[14px] font-semibold flex-1">内容预览</span>
        <button onClick={onUndo} disabled={!canUndo} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20 hover:bg-gray-100" style={{ border: '1px solid var(--border-0)' }} title="撤销">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20 hover:bg-gray-100" style={{ border: '1px solid var(--border-0)' }} title="重做">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
        {score > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: score >= 80 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2',
              color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--err)' }}>
            {score}分
          </span>
        )}
        {/* Edit inputs inline */}
        <input type="text" value={retryInput} onChange={e => setRetryInput(e.target.value)}
          placeholder={`修改第${active + 1}页...`} onKeyDown={e => e.key === 'Enter' && handleRetry()}
          className="w-40 h-8 px-2.5 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }} />
        <button onClick={handleRetry} disabled={!retryInput.trim() || retrying}
          className="h-8 px-2.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-30" style={{ background: accent }}>
          {retrying ? '...' : '重试'}
        </button>
        <input type="text" value={globalInput} onChange={e => setGlobalInput(e.target.value)}
          placeholder="全局修改..." onKeyDown={e => e.key === 'Enter' && handleGlobalEdit()}
          className="w-32 h-8 px-2.5 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }} />
        <button onClick={handleGlobalEdit} disabled={!globalInput.trim() || globalEditing}
          className="h-8 px-2.5 rounded-lg text-[11px] font-medium disabled:opacity-30" style={{ border: `1px solid ${accent}`, color: accent }}>
          {globalEditing ? '...' : '编辑'}
        </button>
        <button onClick={onGenerate} disabled={busy}
          className="h-8 px-4 rounded-lg text-[11px] font-semibold text-white disabled:opacity-30" style={{ background: accent }}>
          {loading ? '...' : '下载 PPTX'}
        </button>
      </div>

      {/* Research summary */}
      {research?.summary && (
        <div className="max-w-[900px] mx-auto mb-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: `${accent}06`, border: `1px solid ${accent}15`, color: 'var(--text-1)' }}>
          {research.summary}
        </div>
      )}

      {issues.length > 0 && (
        <div className="max-w-[900px] mx-auto mb-4 p-2.5 rounded-xl text-[10px]" style={{ background: '#FFFBEB' }}>
          {issues.slice(0, 3).map((iss, i) => <p key={i} style={{ color: 'var(--warn)' }}>P{iss.page}: {iss.issue}</p>)}
        </div>
      )}

      {/* Thumbnail Navigation */}
      <div className="max-w-[900px] mx-auto mb-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {slides.map((sl, i) => (
          <button key={i} onClick={() => { setActive(i); document.getElementById(`slide-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
            className={`shrink-0 w-16 h-10 rounded-md overflow-hidden border-2 transition-all ${i === active ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
            style={{ borderColor: i === active ? accent : 'transparent' }}>
            <div className="w-full h-full flex items-center justify-center text-[5px] font-bold" style={{ background: theme.background, color: theme.primary }}>
              {i + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Slide Gallery: vertical scroll, each slide full-width */}
      <div className="max-w-[900px] mx-auto space-y-6">
        {slides.map((sl, i) => (
          <div key={i} id={`slide-${i}`} onClick={() => setActive(i)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: i === active ? accent : 'var(--text-2)' }}>{i + 1}</span>
              <span className="text-[11px] font-medium" style={{ color: i === active ? accent : 'var(--text-2)' }}>
                {TYPE_LABEL[sl.type] || sl.type} · {sl.layout || 'full-text'}
              </span>
              {sl.source && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                  style={{
                    background: sl.sourceType === 'official' ? '#ECFDF5' : sl.sourceType === 'research' ? '#EFF6FF' : '#FFFBEB',
                    color: sl.sourceType === 'official' ? 'var(--success)' : sl.sourceType === 'research' ? '#2563EB' : 'var(--warn)',
                  }}>
                  {sl.sourceType === 'official' ? '权威来源' : sl.sourceType === 'research' ? '研究数据' : 'AI 推断'}
                </span>
              )}
              {i === active && (
                <button onClick={(e) => { e.stopPropagation(); setZoomed(true); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100" style={{ border: '1px solid var(--border-0)' }} title="放大">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
              )}
            </div>
            <div className={`slide-card ${i === active ? 'ring-2' : ''}`} style={i === active ? { ['--tw-ring-color' as string]: accent } : undefined}>
              <SlideRenderer slide={sl} theme={theme} themeKey={themeKey} pageNum={i + 1} total={slides.length} />
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Modal */}
      {zoomed && slides[active] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setZoomed(false)}>
          <div className="relative w-[92vw] max-w-[1100px]" onClick={e => e.stopPropagation()}>
            <SlideRenderer slide={slides[active]} theme={theme} themeKey={themeKey} pageNum={active + 1} total={slides.length} />
            <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
              className="absolute left-[-52px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-20" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {Icon.left}
            </button>
            <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1}
              className="absolute right-[-52px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-20" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {Icon.right}
            </button>
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between">
              <span className="text-white text-[13px] font-medium">{active + 1} / {slides.length}</span>
              <button onClick={() => setZoomed(false)} className="text-white/70 text-[12px] hover:text-white">ESC 关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-[15px] font-semibold" style={{ color: 'var(--text-0)' }}>大纲编辑</span>
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-2)' }}>{outline.length} 页 · 编辑后点击「确认生成」</span>
      </div>

      {research?.summary && (
        <div className="mb-3 p-2.5 rounded-lg text-[10px] leading-relaxed" style={{ background: `${accent}06`, border: `1px solid ${accent}15`, color: 'var(--text-1)' }}>
          {research.summary.slice(0, 150)}...
        </div>
      )}

      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {outline.map((item, i) => (
          <div key={i} className="p-4 rounded-xl transition-all" style={{ background: 'var(--bg-0)', border: '1px solid var(--border-0)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold w-6 h-6 rounded flex items-center justify-center text-white" style={{ background: accent }}>{i + 1}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>{item.type}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>{item.layout}</span>
              <div className="flex-1" />
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[11px] px-1.5 disabled:opacity-20" style={{ color: accent }}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === outline.length - 1} className="text-[11px] px-1.5 disabled:opacity-20" style={{ color: accent }}>↓</button>
              <button onClick={() => add(i)} className="text-[11px] px-1.5" style={{ color: 'var(--success)' }}>+</button>
              <button onClick={() => remove(i)} disabled={outline.length <= 3} className="text-[11px] px-1.5 disabled:opacity-20" style={{ color: 'var(--err)' }}>×</button>
            </div>
            <input value={item.title} onChange={e => update(i, 'title', e.target.value)}
              className="w-full text-[14px] font-medium px-3 py-1.5 rounded-lg outline-none mb-1.5"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', color: 'var(--text-0)' }} />
            {item.bullets.map((b, j) => (
              <div key={j} className="flex gap-1.5 mb-1">
                <span className="text-[10px] mt-1.5" style={{ color: accent }}>•</span>
                <input value={b} onChange={e => {
                  const newBullets = [...item.bullets]; newBullets[j] = e.target.value;
                  update(i, 'bullets', newBullets);
                }}
                  className="flex-1 text-[13px] px-2 py-1 rounded-lg outline-none"
                  style={{ background: 'var(--bg-1)', color: 'var(--text-1)' }} />
                <button onClick={() => update(i, 'bullets', item.bullets.filter((_, k) => k !== j))}
                  className="text-[10px] px-1.5" style={{ color: 'var(--text-2)' }}>×</button>
              </div>
            ))}
            <button onClick={() => update(i, 'bullets', [...item.bullets, '新要点'])}
              className="text-[11px] mt-1" style={{ color: accent }}>+ 添加要点</button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[12px] shrink-0" style={{ color: 'var(--text-2)' }}>
        编辑大纲后点击「确认生成」，AI 将根据调整后的大纲重新检索数据并生成内容。
      </p>
    </div>
  );
}

/* ── (Structure removed — replaced by inline hero state) ── */
