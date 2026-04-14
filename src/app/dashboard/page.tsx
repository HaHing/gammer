'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { templates } from '@/data/templates';

interface ProjectSummary {
  id: string;
  title: string;
  theme: string;
  pageCount: number;
  scenes: string | null;
  updatedAt: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(d => {
      setProjects(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const deleteProject = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-0, #0a0a0a)', color: 'var(--text-0, #e5e5e5)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: 'var(--border-0, #222)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg">Gammer</span>
        </div>
        <Link href="/create" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          + 新建
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Recent Projects */}
        <h2 className="text-xl font-bold mb-4">最近项目</h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-2, #888)' }}>加载中...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2, #888)' }}>还没有项目</p>
            <Link href="/create" className="text-sm px-4 py-2 rounded-lg font-medium text-white inline-block" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              创建第一个演示文稿
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-12">
            {projects.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden group" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
                <div className="aspect-video flex items-center justify-center text-3xl cursor-pointer" style={{ background: 'var(--bg-2, #1a1a1a)' }}
                  onClick={() => router.push(`/edit/${p.id}`)}>
                  📑
                </div>
                <div className="p-3 flex items-start justify-between">
                  <div className="cursor-pointer" onClick={() => router.push(`/edit/${p.id}`)}>
                    <h3 className="text-sm font-medium truncate">{p.title}</h3>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-2, #888)' }}>
                      {p.pageCount} 页 · {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <button onClick={() => deleteProject(p.id)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-red-500/20" style={{ color: '#f87171' }}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Templates */}
        <h2 className="text-xl font-bold mb-4">快速模板</h2>
        <div className="grid grid-cols-4 gap-4">
          {templates.map(t => (
            <Link key={t.id} href={`/create?scene=${t.id}`} className="p-4 rounded-xl hover:scale-[1.02] transition-transform" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
              <div className="text-2xl mb-2">{t.icon}</div>
              <h3 className="font-medium text-sm mb-1">{t.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-2, #888)' }}>{t.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
