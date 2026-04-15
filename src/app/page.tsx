'use client';
import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [topic, setTopic] = useState('');
  const router = useRouter();
  const go = () => router.push(topic.trim() ? `/create?topic=${encodeURIComponent(topic.trim())}` : '/create');

  return (
    <div className="min-h-screen bg-white text-[#1e1e1e]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 h-16 bg-white border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#templates" className="text-sm font-medium text-[#666] hover:text-[#1e1e1e]">模板</a>
          <a href="#examples" className="text-sm font-medium text-[#666] hover:text-[#1e1e1e]">示例</a>
          <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED] hover:bg-[#0b85db]">开始创建</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center pt-24 pb-20 px-10 text-center">
        <h1 className="text-6xl font-bold mb-5 leading-[1.05] tracking-[-0.03em]">AI 驱动的演示文稿<br/>一键生成</h1>
        <p className="text-lg mb-10 max-w-xl leading-relaxed text-[#666]">输入主题，AI 自动搜索权威数据、生成专业大纲、渲染精美 Slide。支持 8 种场景模板。</p>
        <div className="flex gap-3 w-full max-w-lg">
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="输入演示主题，例如：2026 Q1 技术架构升级方案"
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#7C3AED] transition-colors" />
          <button onClick={go} className="px-6 py-3 rounded-lg font-semibold text-sm text-white shrink-0 bg-[#7C3AED] hover:bg-[#0b85db]">开始创建</button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: '🔍', title: '智能研究', desc: '自动搜索权威数据源，注入真实数据和引用' },
            { icon: '✍️', title: 'AI 生成', desc: '基于 Claude 生成专业内容，支持 16 种 Slide 布局' },
            { icon: '📊', title: '数据驱动', desc: '自动质量检查 + 自优化，确保内容专业可靠' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-[#e5e5e5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#666]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20 px-10 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center tracking-[-0.02em]">多种专业场景模板</h2>
        <div className="grid grid-cols-4 gap-4">
          {templates.map(t => (
            <Link key={t.id} href={`/create?scene=${t.id}`} className="p-5 rounded-xl border border-[#e5e5e5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-[#d5d5d5] transition-all">
              <div className="text-2xl mb-2">{t.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
              <p className="text-xs leading-relaxed text-[#666]">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="py-20 px-10 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center tracking-[-0.02em]">示例展示</h2>
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

      {/* CTA */}
      <section className="py-20 px-10 text-center">
        <h2 className="text-3xl font-bold mb-4 tracking-[-0.02em]">免费开始创建</h2>
        <p className="mb-6 text-[#666]">无需注册，立即体验 AI 演示文稿生成</p>
        <Link href="/create" className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-[#7C3AED] hover:bg-[#0b85db]">开始创建 →</Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-10 text-center text-xs border-t border-[#e5e5e5] text-[#999]">
        © 2026 Gammer · AI-Powered Presentation Builder
      </footer>
    </div>
  );
}
