'use client';
import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white text-[#1e1e1e]">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 h-16 bg-white border-b border-[#e5e5e5]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </Link>
        <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED]">开始创建</Link>
      </nav>
      <main className="max-w-5xl mx-auto px-10 py-10">
        <h1 className="text-3xl font-bold mb-10 tracking-[-0.02em]">模板库</h1>
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-5">场景模板</h2>
          <div className="grid grid-cols-4 gap-4">
            {templates.map(t => (
              <Link key={t.id} href={`/create?scene=${t.id}`} className="p-5 rounded-xl border border-[#e5e5e5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-[#d5d5d5] transition-all">
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-semibold mb-1">{t.name}</h3>
                <p className="text-xs leading-relaxed text-[#666]">{t.description}</p>
                <p className="text-[11px] mt-2 text-[#999]">默认 {t.defaultPageCount} 页</p>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-5">示例展示</h2>
          <div className="grid grid-cols-3 gap-6">
            {examples.map(ex => (
              <div key={ex.id} className="rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="aspect-video flex items-center justify-center text-4xl bg-[#f5f5f5]">📑</div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{ex.title}</h3>
                  <p className="text-xs mb-2 leading-relaxed text-[#666]">{ex.description}</p>
                  <div className="flex gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-[#f5f5f5] text-[#666]">{ex.scene}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-[#f5f5f5] text-[#666]">{ex.pages} 页</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
