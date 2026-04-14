'use client';

import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';

export default function GalleryPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-0, #e5e5e5)' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: 'var(--border-0, #222)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg">Gammer</span>
        </Link>
        <Link href="/create" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>开始创建</Link>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">模板库</h1>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">场景模板</h2>
          <div className="grid grid-cols-4 gap-4">
            {templates.map(t => (
              <Link key={t.id} href={`/create?scene=${t.id}`} className="p-5 rounded-xl hover:scale-[1.02] transition-transform" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-medium mb-1">{t.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-2, #888)' }}>{t.description}</p>
                <p className="text-[10px] mt-2" style={{ color: 'var(--text-2, #666)' }}>默认 {t.defaultPageCount} 页</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">示例展示</h2>
          <div className="grid grid-cols-3 gap-6">
            {examples.map(ex => (
              <div key={ex.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
                <div className="aspect-video flex items-center justify-center text-4xl" style={{ background: 'var(--bg-2, #1a1a1a)' }}>📑</div>
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-1">{ex.title}</h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-2, #888)' }}>{ex.description}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2, #222)' }}>{ex.scene}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2, #222)' }}>{ex.pages} 页</span>
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
