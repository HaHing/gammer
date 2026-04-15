'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { templates } from '@/data/templates';

interface P { id: string; title: string; theme: string; pageCount: number; updatedAt: string; scenes: string | null }

export default function DashboardPage() {
  const [projects, setProjects] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (status !== 'authenticated') return;
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(d => { setProjects(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, [status, router]);

  const rel = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m}分钟前` : m < 1440 ? `${Math.floor(m / 60)}小时前` : `${Math.floor(m / 1440)}天前`; };
  const del = async (id: string) => { if (!confirm('确定删除？')) return; await fetch(`/api/projects/${id}`, { method: 'DELETE' }); setProjects(p => p.filter(x => x.id !== id)); };

  return (
    <div className="min-h-screen bg-white text-[#1e1e1e]">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-10 h-16 bg-white border-b border-[#e5e5e5]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </Link>
        <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED]">+ 新建</Link>
      </nav>
      <main className="max-w-5xl mx-auto px-10 py-10">
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5 tracking-tight">最近项目</h2>
          {loading ? <p className="text-sm text-[#999]">加载中...</p> : projects.length === 0 ? (
            <div className="p-10 rounded-xl border border-[#e5e5e5] text-center">
              <p className="text-sm mb-4 text-[#666]">还没有项目</p>
              <Link href="/create" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white bg-[#7C3AED] inline-block">创建第一个演示文稿</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {projects.map(p => (
                <div key={p.id} className="rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow group">
                  <Link href={`/edit/${p.id}`}>
                    <div className="aspect-video flex items-center justify-center text-3xl bg-[#f5f5f5]">📑</div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold truncate">{p.title || '未命名'}</h3>
                      <p className="text-xs mt-1 text-[#999]">{rel(p.updatedAt)} · {p.pageCount}页</p>
                    </div>
                  </Link>
                  <div className="px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => del(p.id)} className="text-xs px-2 py-1 rounded text-[#F24E1E]">删除</button>
                  </div>
                </div>
              ))}
              <Link href="/create" className="rounded-xl border-2 border-dashed border-[#e5e5e5] flex items-center justify-center aspect-[4/3] hover:border-[#7C3AED] transition-colors">
                <span className="text-2xl text-[#999]">+</span>
              </Link>
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xl font-bold mb-5 tracking-tight">快速模板</h2>
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
      </main>
    </div>
  );
}
