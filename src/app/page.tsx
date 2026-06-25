'use client';
import Link from 'next/link';
import { templates } from '@/data/templates';
import { examples } from '@/data/examples';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserMenuFab from '@/components/UserMenuFab';

const WORKFLOW_STEPS = [
  { num: '01', title: '输入主题', desc: '描述你的演示主题和场景，AI 理解你的意图', icon: '✍️', color: '#7C3AED' },
  { num: '02', title: '智能研究', desc: '自动搜索权威数据源，提取关键数据和洞察', icon: '🔍', color: '#2563EB' },
  { num: '03', title: '生成大纲', desc: 'AI 规划叙事结构，每页有明确的论点和数据支撑', icon: '📋', color: '#059669' },
  { num: '04', title: '渲染 Slide', desc: '16 种专业布局 + 7 种图表模式，一键生成 PPTX', icon: '🎨', color: '#D97706' },
];

const STATS = [
  { value: '16', label: '种 Slide 布局' },
  { value: '13', label: '种配色主题' },
  { value: '7', label: '种图表模式' },
  { value: '13', label: '种场景模板' },
];

export default function LandingPage() {
  const [topic, setTopic] = useState('');
  const router = useRouter();
  const go = () => router.push(topic.trim() ? `/create?topic=${encodeURIComponent(topic.trim())}` : '/create');

  return (
    <div className="min-h-screen bg-white text-[#1e1e1e]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 h-16 bg-white/80 backdrop-blur-md border-b border-[#e5e5e5]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#workflow" className="text-sm font-medium text-[#666] hover:text-[#1e1e1e] transition-colors">工作流</a>
          <a href="#templates" className="text-sm font-medium text-[#666] hover:text-[#1e1e1e] transition-colors">模板</a>
          <a href="#examples" className="text-sm font-medium text-[#666] hover:text-[#1e1e1e] transition-colors">示例</a>
          <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors">开始创建</Link>
          <UserMenuFab />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f3ff]/50 to-white pointer-events-none" />
        <div className="relative flex flex-col items-center pt-28 pb-24 px-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f5f3ff] border border-[#e9e5ff] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <span className="text-xs font-medium text-[#7C3AED]">AI 驱动 · 数据驱动 · 一键生成</span>
          </div>
          <h1 className="text-[56px] font-bold mb-5 leading-[1.08] tracking-[-0.03em]">
            输入主题，AI 生成<br/>
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">专业演示文稿</span>
          </h1>
          <p className="text-lg mb-10 max-w-2xl leading-relaxed text-[#666]">
            自动搜索权威数据、生成结构化大纲、渲染精美 Slide。<br/>
            支持流程图、架构图等 7 种图表模式，13 种商务配色主题。
          </p>
          <div className="flex gap-3 w-full max-w-lg">
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
              placeholder="输入演示主题，例如：2026 Q1 技术架构升级方案"
              className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#7C3AED] transition-colors shadow-sm" />
            <button onClick={go} className="px-7 py-3.5 rounded-xl font-semibold text-sm text-white shrink-0 bg-[#7C3AED] hover:bg-[#6D28D9] shadow-md hover:shadow-lg transition-all">开始创建</button>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-8 mt-12">
            {STATS.map(s => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#7C3AED]">{s.value}</span>
                <span className="text-sm text-[#999]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20 px-10 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center tracking-[-0.02em]">四步完成专业演示</h2>
        <p className="text-center text-[#666] mb-12 text-sm">从主题到 PPTX，全程 AI 驱动</p>
        <div className="grid grid-cols-4 gap-5">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.num} className="relative p-6 rounded-xl border border-[#e5e5e5] hover:shadow-md transition-all group">
              {i < 3 && <div className="absolute top-1/2 -right-3 w-6 h-[2px] bg-[#e5e5e5] hidden lg:block" />}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4" style={{ background: `${step.color}10` }}>
                {step.icon}
              </div>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: step.color }}>STEP {step.num}</div>
              <h3 className="font-semibold mb-1.5">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[#666]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-10 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-3 text-center tracking-[-0.02em]">核心能力</h2>
          <p className="text-center text-[#666] mb-12 text-sm">不只是生成文字，更是完整的数据驱动演示方案</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: '深度研究引擎', desc: '基于 Claude web_search 搜索权威数据源，自动提取关键数据、行业洞察和竞争情报，注入真实引用。', tag: 'AI Research' },
              { icon: '📊', title: '数据可视化', desc: '自动识别数据并生成柱状图、饼图、折线图、大数字展示。支持 metrics-grid、chart-focus 等专业布局。', tag: 'Data Viz' },
              { icon: '⬡', title: '智能图表系统', desc: 'AI 驱动的 draw.io 图表，支持流程图、架构图、ER 图、时序图、思维导图、网络拓扑、组织架构 7 种模式。', tag: 'Diagrams' },
              { icon: '✨', title: '自动质量优化', desc: '内置质量检查器 + 自优化引擎，自动检测内容问题并修复。视觉节奏检查确保不会连续出现文字密集页。', tag: 'Quality' },
              { icon: '🎨', title: '13 种商务主题', desc: '从经典蓝到品牌红，每种主题含 5 套配色方案。支持自定义主色/辅色，适配各种企业品牌。', tag: 'Themes' },
              { icon: '📥', title: '一键导出 PPTX', desc: '生成标准 PowerPoint 文件，保留所有布局、图表、数据。可直接用于会议演示，无需二次编辑。', tag: 'Export' },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-xl bg-white border border-[#e5e5e5] hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{f.icon}</div>
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#7C3AED]">{f.tag}</span>
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#666]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagram Modes */}
      <section className="py-20 px-10 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center tracking-[-0.02em]">7 种专业图表模式</h2>
        <p className="text-center text-[#666] mb-8 text-sm">AI 驱动的 draw.io 图表，支持细粒度编辑与版本控制</p>
        <div className="grid grid-cols-7 gap-3">
          {[
            { icon: '⬡', name: '流程图', desc: '步骤与决策' },
            { icon: '↔', name: '时序图', desc: '服务调用顺序' },
            { icon: '⬜', name: '架构图', desc: '系统组件层次' },
            { icon: '⊞', name: 'ER 图', desc: '数据库实体' },
            { icon: '✦', name: '思维导图', desc: '主题与子主题' },
            { icon: '◎', name: '网络拓扑', desc: '节点与连接' },
            { icon: '▤', name: '组织架构', desc: '层级汇报' },
          ].map(m => (
            <div key={m.name} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e5e5e5] hover:shadow-md hover:border-[#d0bfff] transition-all">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs font-semibold text-center">{m.name}</span>
              <span className="text-[10px] text-center text-[#999]">{m.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[#666]">
          <span className="flex items-center gap-1.5"><span className="text-[#7C3AED]">✓</span> AI 一键生成</span>
          <span className="flex items-center gap-1.5"><span className="text-[#7C3AED]">✓</span> 自然语言优化</span>
          <span className="flex items-center gap-1.5"><span className="text-[#7C3AED]">✓</span> 版本历史还原</span>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20 px-10 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-3 text-center tracking-[-0.02em]">13 种专业场景模板</h2>
          <p className="text-center text-[#666] mb-10 text-sm">覆盖技术评审、项目汇报、融资路演等常见商务场景</p>
          <div className="grid grid-cols-4 gap-4">
            {templates.map(t => (
              <Link key={t.id} href={`/create?scene=${t.id}`} className="p-5 rounded-xl bg-white border border-[#e5e5e5] hover:shadow-md hover:border-[#d5d5d5] transition-all group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{t.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                <p className="text-xs leading-relaxed text-[#666]">{t.description}</p>
                <p className="text-[11px] mt-2 text-[#999]">默认 {t.defaultPageCount} 页</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="py-20 px-10 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center tracking-[-0.02em]">示例展示</h2>
        <p className="text-center text-[#666] mb-10 text-sm">真实场景生成效果</p>
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

      {/* CTA */}
      <section className="py-24 px-10 text-center bg-gradient-to-b from-white to-[#f5f3ff]">
        <h2 className="text-3xl font-bold mb-4 tracking-[-0.02em]">开始创建你的演示文稿</h2>
        <p className="mb-8 text-[#666] max-w-md mx-auto">登录后即可使用全部功能，AI 自动搜索数据、生成大纲、渲染 Slide</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/create" className="inline-block px-8 py-3.5 rounded-xl font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-md hover:shadow-lg transition-all">开始创建 →</Link>
          <Link href="/gallery" className="inline-block px-8 py-3.5 rounded-xl font-semibold text-[#7C3AED] border-2 border-[#7C3AED] hover:bg-[#f5f3ff] transition-all">浏览模板库</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-10 text-center text-xs border-t border-[#e5e5e5] text-[#999]">
        © 2026 Gammer · AI-Powered Presentation Builder
      </footer>
    </div>
  );
}
