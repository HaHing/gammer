'use client';
import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';
import UserMenuFab from '@/components/UserMenuFab';
import { useState } from 'react';

const CATEGORIES = ['全部', '技术', '管理', '商务', '数据'] as const;
const CATEGORY_MAP: Record<string, string> = {
  'tech-review': '技术', 'arch-review': '技术', 'postmortem': '技术',
  'milestone': '管理', 'okr': '管理', 'annual': '管理', 'training': '管理',
  'budget': '商务', 'vendor': '商务', 'product-launch': '商务', 'investor-pitch': '商务',
  'competitive': '数据', 'data-report': '数据',
};

export default function GalleryPage() {
  const [filter, setFilter] = useState<string>('全部');
  const filtered = filter === '全部' ? templates : templates.filter(t => CATEGORY_MAP[t.id] === filter);

  return (
    <div className="min-h-screen bg-white text-[#1e1e1e]">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 h-16 bg-white/80 backdrop-blur-md border-b border-[#e5e5e5]/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors">开始创建</Link>
          <UserMenuFab />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-10 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2 tracking-[-0.02em]">模板库</h1>
          <p className="text-sm text-[#666]">选择场景模板快速开始，或从空白主题创建</p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-8">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === c ? '#7C3AED' : '#f5f5f5',
                color: filter === c ? '#fff' : '#666',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Templates */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold mb-5">场景模板 <span className="text-sm font-normal text-[#999]">({filtered.length})</span></h2>
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(t => (
              <Link key={t.id} href={`/create?scene=${t.id}`} className="p-5 rounded-xl border border-[#e5e5e5] hover:shadow-md hover:border-[#d5d5d5] transition-all group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{t.icon}</div>
                <h3 className="font-semibold mb-1">{t.name}</h3>
                <p className="text-xs leading-relaxed text-[#666]">{t.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5f3ff] text-[#7C3AED] font-medium">{t.defaultPageCount} 页</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5f5f5] text-[#666] font-medium">{CATEGORY_MAP[t.id] || '通用'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section>
          <h2 className="text-lg font-semibold mb-5">示例展示</h2>
          <div className="grid grid-cols-3 gap-6">
            {examples.map(ex => (
              <div key={ex.id} className="rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-md transition-all group">
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] relative">
                  <div className="text-4xl group-hover:scale-110 transition-transform">📑</div>
                  <div className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-md bg-white/80 text-[#666] font-medium">{ex.pages} 页</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{ex.title}</h3>
                  <p className="text-xs mb-3 leading-relaxed text-[#666]">{ex.description}</p>
                  <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-[#f5f3ff] text-[#7C3AED]">{ex.scene}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
