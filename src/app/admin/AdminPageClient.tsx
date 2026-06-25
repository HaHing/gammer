'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  pageQuota: number;
  pageUsed: number;
  remaining: number;
  projectCount: number;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  users: AdminUserRow[];
  summary: {
    totalUsers: number;
    lowQuotaUsers: number;
    exhaustedUsers: number;
    onlineUsers: number;
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [summary, setSummary] = useState<AdminUsersResponse['summary'] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        if (res.status === 401) throw new Error('登录状态失效，请重新登录');
        if (res.status === 403) throw new Error('你没有后台管理权限（需要管理员账号）');
        throw new Error(body.error || `加载用户数据失败 (${res.status})`);
      }
      const data = await res.json() as AdminUsersResponse;
      setUsers(data.users || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateUser = useCallback(async (userId: string, body: Record<string, unknown>) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(payload.error || `保存失败 (${res.status})`);
      }
      await load();
    } catch (e) {
      alert((e as Error).message || '操作失败，请重试');
    } finally {
      setSavingId(null);
    }
  }, [load]);

  const cards = useMemo(() => ([
    { label: '总用户数', value: summary?.totalUsers ?? 0 },
    { label: '在线用户（5分钟）', value: summary?.onlineUsers ?? 0 },
    { label: '配额告警（<=2页）', value: summary?.lowQuotaUsers ?? 0 },
    { label: '已耗尽用户', value: summary?.exhaustedUsers ?? 0 },
  ]), [summary]);

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#1f2430] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">后台管理</h1>
            <p className="text-sm text-[#6B7280] mt-1">监控用户配额与使用情况（新用户默认 10 页）</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-2 rounded-lg border border-[#DCE0E8] bg-white text-sm hover:bg-[#FAFAFA]">刷新</button>
            <Link href="/dashboard" className="px-3 py-2 rounded-lg border border-[#DCE0E8] bg-white text-sm hover:bg-[#FAFAFA]">返回项目</Link>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-[#E6E8EC] bg-white px-4 py-3">
              <p className="text-xs text-[#6B7280]">{c.label}</p>
              <p className="text-xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#E6E8EC] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EEF1F5] text-sm font-semibold">用户列表</div>

          {loading ? (
            <div className="p-6 text-sm text-[#6B7280]">加载中...</div>
          ) : error ? (
            <div className="p-6 text-sm text-[#B42318]">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-[#6B7280]">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] text-[#667085]">
                    <th className="text-left px-4 py-2 font-medium">用户</th>
                    <th className="text-left px-4 py-2 font-medium">角色</th>
                    <th className="text-left px-4 py-2 font-medium">配额</th>
                    <th className="text-left px-4 py-2 font-medium">状态</th>
                    <th className="text-left px-4 py-2 font-medium">项目数</th>
                    <th className="text-left px-4 py-2 font-medium">上次登录</th>
                    <th className="text-left px-4 py-2 font-medium">上次活跃</th>
                    <th className="text-left px-4 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[#F0F2F6]">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.name || u.email.split('@')[0]}</p>
                        <p className="text-xs text-[#6B7280]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-[#F4EBFF] text-[#7A2EF6]' : 'bg-[#F2F4F7] text-[#475467]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.pageUsed} / {u.pageQuota}</p>
                        <p className={`text-xs ${u.remaining <= 0 ? 'text-[#B42318]' : u.remaining <= 2 ? 'text-[#B54708]' : 'text-[#12B76A]'}`}>
                          剩余 {u.remaining} 页
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.isOnline ? 'bg-[#ECFDF3] text-[#067647]' : 'bg-[#F2F4F7] text-[#475467]'}`}>
                          {u.isOnline ? '在线' : '离线'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.projectCount}</td>
                      <td className="px-4 py-3 text-xs text-[#667085]">{formatDateTime(u.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-xs text-[#667085]">{formatDateTime(u.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            disabled={savingId === u.id}
                            onClick={() => updateUser(u.id, { grantPages: 10 })}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#DCE0E8] hover:bg-[#FAFAFA] disabled:opacity-40"
                          >
                            +10 页
                          </button>
                          <button
                            disabled={savingId === u.id}
                            onClick={() => updateUser(u.id, { pageUsed: 0 })}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#DCE0E8] hover:bg-[#FAFAFA] disabled:opacity-40"
                          >
                            重置用量
                          </button>
                          <button
                            disabled={savingId === u.id}
                            onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#DCE0E8] hover:bg-[#FAFAFA] disabled:opacity-40"
                          >
                            设为{u.role === 'admin' ? '普通用户' : '管理员'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
