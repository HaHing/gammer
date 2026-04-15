'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const go = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const res = await signIn('credentials', { email: email.trim(), name: name.trim() || undefined, redirect: false });
    setLoading(false);
    if (res?.ok) router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-white border border-[#e5e5e5]">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #F24E1E, #A259FF)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </div>
        <h2 className="text-center text-lg font-semibold mb-6">登录 / 注册</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="你的名字（可选）"
            className="w-full px-4 py-3 rounded-lg text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#0D99FF] transition-colors" />
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
            placeholder="邮箱地址" type="email"
            className="w-full px-4 py-3 rounded-lg text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#0D99FF] transition-colors" />
          <button onClick={go} disabled={loading || !email.trim()}
            className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-50 bg-[#0D99FF] hover:bg-[#0b85db]">
            {loading ? '登录中...' : '继续'}
          </button>
        </div>
        <p className="text-center text-xs mt-4 text-[#999]">首次使用将自动创建账号</p>
      </div>
    </div>
  );
}
