'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const res = await signIn('credentials', { email: email.trim(), name: name.trim() || undefined, redirect: false });
    setLoading(false);
    if (res?.ok) router.push('/create');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0, #0a0a0a)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--bg-1, #111)', border: '1px solid var(--border-0, #222)' }}>
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-0, #e5e5e5)' }}>Gammer</span>
        </div>
        <h2 className="text-center text-lg font-semibold mb-6" style={{ color: 'var(--text-0, #e5e5e5)' }}>登录 / 注册</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字（可选）"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-0, #0a0a0a)', border: '1px solid var(--border-0, #333)', color: 'var(--text-0, #e5e5e5)' }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="邮箱地址"
            type="email"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-0, #0a0a0a)', border: '1px solid var(--border-0, #333)', color: 'var(--text-0, #e5e5e5)' }}
          />
          <button
            onClick={handleLogin}
            disabled={loading || !email.trim()}
            className="w-full py-3 rounded-xl font-medium text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            {loading ? '登录中...' : '继续'}
          </button>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-2, #666)' }}>首次使用将自动创建账号</p>
      </div>
    </div>
  );
}
