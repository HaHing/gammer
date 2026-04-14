import { create } from 'zustand';
import { temporal } from 'zundo';
import type { PageCount, StyleTheme, SlideContent, OutlineItem } from '@/lib/types';

export interface ResearchData {
  summary: string;
  keyStats: { metric: string; value: string; source: string }[];
  findingsCount?: number;
  sourcesCount?: number;
}

export interface PreviewResponse {
  previewId: string;
  slides: SlideContent[];
  issues: { page: number; issue: string; severity: string }[];
  score: number;
  research?: ResearchData;
}

type Phase = 'idle' | 'outline' | 'research' | 'generating' | 'checking' | 'optimizing' | 'done';

interface PresentationState {
  // Input
  topic: string;
  description: string;
  pageCount: PageCount;
  theme: StyleTheme;
  paletteIdx: number;
  scenes: string;
  lang: 'zh' | 'en';
  urlInput: string;

  // Outline
  outline: OutlineItem[] | null;
  researchId: string;
  outlineResearch: ResearchData | undefined;

  // Preview
  previewData: PreviewResponse | null;
  activeSlide: number;

  // UI
  phase: Phase;
  progress: number;
  previewStatus: string;
  slidesDone: number;
  taskLogs: string[];
  loading: boolean;
  previewing: boolean;
  outlineLoading: boolean;
  urlLoading: boolean;
  sidebarOpen: boolean;

  // Actions
  setTopic: (v: string) => void;
  setDescription: (v: string) => void;
  setPageCount: (v: PageCount) => void;
  setTheme: (v: StyleTheme) => void;
  setPaletteIdx: (v: number) => void;
  setScenes: (v: string) => void;
  setLang: (v: 'zh' | 'en') => void;
  setUrlInput: (v: string) => void;
  setOutline: (v: OutlineItem[] | null) => void;
  setResearchId: (v: string) => void;
  setOutlineResearch: (v: ResearchData | undefined) => void;
  setPreviewData: (v: PreviewResponse | null) => void;
  setActiveSlide: (v: number) => void;
  setPhase: (v: Phase) => void;
  setPreviewStatus: (v: string) => void;
  setSlidesDone: (v: number) => void;
  addTaskLog: (v: string) => void;
  clearTaskLogs: () => void;
  setLoading: (v: boolean) => void;
  setPreviewing: (v: boolean) => void;
  setOutlineLoading: (v: boolean) => void;
  setUrlLoading: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  updateSlide: (i: number, slide: SlideContent) => void;
  replaceSlides: (slides: SlideContent[]) => void;
  reset: () => void;
}

const initialState = {
  topic: '',
  description: '',
  pageCount: 10 as PageCount,
  theme: 'brand' as StyleTheme,
  paletteIdx: 0,
  scenes: '',
  lang: 'zh' as const,
  urlInput: '',
  outline: null,
  researchId: '',
  outlineResearch: undefined,
  previewData: null,
  activeSlide: 0,
  phase: 'idle' as Phase,
  progress: 0,
  previewStatus: '',
  slidesDone: 0,
  taskLogs: [] as string[],
  loading: false,
  previewing: false,
  outlineLoading: false,
  urlLoading: false,
  sidebarOpen: true,
};

export const usePresentationStore = create<PresentationState>()(
  temporal(
    (set) => ({
      ...initialState,
      setTopic: (v) => set({ topic: v }),
      setDescription: (v) => set({ description: v }),
      setPageCount: (v) => set({ pageCount: v, outline: null, previewData: null }),
      setTheme: (v) => set({ theme: v, paletteIdx: 0 }),
      setPaletteIdx: (v) => set({ paletteIdx: v }),
      setScenes: (v) => set({ scenes: v }),
      setLang: (v) => set({ lang: v }),
      setUrlInput: (v) => set({ urlInput: v }),
      setOutline: (v) => set({ outline: v }),
      setResearchId: (v) => set({ researchId: v }),
      setOutlineResearch: (v) => set({ outlineResearch: v }),
      setPreviewData: (v) => set({ previewData: v }),
      setActiveSlide: (v) => set({ activeSlide: v }),
      setPhase: (v) => set({ phase: v }),
      setPreviewStatus: (v) => set({ previewStatus: v }),
      setSlidesDone: (v) => set({ slidesDone: v }),
      addTaskLog: (v) => set((s) => ({ taskLogs: [...s.taskLogs, v] })),
      clearTaskLogs: () => set({ taskLogs: [] }),
      setLoading: (v) => set({ loading: v }),
      setPreviewing: (v) => set({ previewing: v }),
      setOutlineLoading: (v) => set({ outlineLoading: v }),
      setUrlLoading: (v) => set({ urlLoading: v }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      updateSlide: (i, slide) => set((s) => {
        if (!s.previewData) return {};
        const slides = [...s.previewData.slides];
        slides[i] = slide;
        return { previewData: { ...s.previewData, slides } };
      }),
      replaceSlides: (slides) => set((s) => {
        if (!s.previewData) return {};
        return { previewData: { ...s.previewData, slides } };
      }),
      reset: () => set(initialState),
    }),
    { limit: 50, equality: (a, b) => a.previewData === b.previewData && a.outline === b.outline }
  )
);
