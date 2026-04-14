'use client';

import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [topic, setTopic] = useState('');
  const router = useRouter();

  const go = () => {
    router.push(topic.trim() ? `/create?topic=${encodeURIComponent(topic.trim())}` : '/create');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-0, #e5e5e5)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: 'var(--border-0, #222)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg">Gammer</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'var(--bg-2, #222)', color: 'var(--text-2, #888)' }}>v0.1</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#templates" className="text-sm hover:opacity-80" style={{ color: 'var(--text-2, #888)' }}>模板</a>
          <Link href="/create" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>开始创建</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <h1 className="text-5xl font-bold mb-4 leading-tight">AI 驱动的演示文稿<br />一键生成</h1>
        <p className="text-lg mb-8 max-w-xl" style={{ color: 'var(--text-2, #888)' }}>输入主题，AI 自动搜索权威数据、生成专业大纲、渲染精美 Slide。支持 8 种专业场景。</p>
        <div className="flex gap-3 w-full max-w-lg">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="输入演示主题，例如：2026 Q1 技术架构升级方案"
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #333)', color: 'var(--text-0, #e5e5e5)' }}
          />
          <button onClick={go} className="px-6 py-3 rounded-xl font-medium text-sm text-white shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            开始创建
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: '智能研究', desc: '自动搜索权威数据源，注入真实数据和引用' },
            { icon: '✍️', title: 'AI 生成', desc: '基于 Claude 生成专业内容，支持 16 种 Slide 布局' },
            { icon: '📊', title: '数据驱动', desc: '自动质量检查 + 自优化，确保内容专业可靠' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-2, #888)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-16 px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">8 种专业场景模板</h2>
        <div className="grid grid-cols-4 gap-4">
          {templates.map((t) => (
            <Link key={t.id} href={`/create?scene=${t.id}`} className="p-4 rounded-xl hover:scale-[1.02] transition-transform" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
              <div className="text-2xl mb-2">{t.icon}</div>
              <h3 className="font-medium text-sm mb-1">{t.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-2, #888)' }}>{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="py-16 px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">示例展示</h2>
        <div className="grid grid-cols-3 gap-6">
          {examples.map((ex) => (
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

      {/* How it works */}
      <section className="py-16 px-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-8">3 步完成</h2>
        <div className="flex items-center justify-between">
          {[
            { step: '1', title: '输入主题', desc: '描述你的演示需求' },
            { step: '2', title: 'AI 生成', desc: '自动研究 + 生成内容' },
            { step: '3', title: '下载 PPTX', desc: '一键导出专业演示文稿' },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mb-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>{s.step}</div>
                <h3 className="font-medium text-sm">{s.title}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2, #888)' }}>{s.desc}</p>
              </div>
              {i < 2 && <div className="w-16 h-[2px] mx-4" style={{ background: 'var(--bg-3, #333)' }} />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">免费开始创建</h2>
        <p className="mb-6" style={{ color: 'var(--text-2, #888)' }}>无需注册，立即体验 AI 演示文稿生成</p>
        <Link href="/create" className="inline-block px-8 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          开始创建 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 text-center text-xs border-t" style={{ borderColor: 'var(--border-0, #222)', color: 'var(--text-2, #888)' }}>
        © 2026 Gammer · AI-Powered Presentation Builder
      </footer>
    </div>
  );
}
