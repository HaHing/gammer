'use client';
import { signIn } from 'next-auth/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}

function LoginInner() {
  const allowDevCredentials = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_CREDENTIALS === 'true';
  const hasGoogle = process.env.NEXT_PUBLIC_HAS_GOOGLE_OAUTH === 'true';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/create';
  const authError = searchParams.get('error');
  const handledError = useRef(false);

  // Show auth error once, then strip it from URL — no cookie clearing, no loop
  useEffect(() => {
    if (authError && !handledError.current) {
      handledError.current = true;
      const msg = authError === 'Configuration'
        ? 'Google 登录回调失败，请检查网络或使用邮箱登录。'
        : `登录失败：${authError}`;
      setError(msg);
      // Remove error param so refresh doesn't re-show
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [authError]);

  const signInGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setLoading(false);
      setError('Google 登录失败，请重试');
    }
  };

  const signInDev = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email: email.trim(),
      name: name.trim() || undefined,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.ok) {
      // Full page navigation to ensure the new session cookie is sent
      window.location.href = callbackUrl;
      return;
    }
    setError('邮箱登录失败，请检查配置');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-white border border-[#e5e5e5]">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Gammer</span>
        </div>
        <h2 className="text-center text-lg font-semibold mb-6">登录 / 注册</h2>
        <div className="space-y-3">
          {hasGoogle && (
            <button onClick={signInGoogle} disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-50 bg-[#7C3AED] hover:bg-[#6D28D9]">
              {loading ? '登录中...' : '使用 Google 继续'}
            </button>
          )}
          {allowDevCredentials && (
            <>
              {hasGoogle && (
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-[#eaeaea]" />
                  <span className="text-[11px] text-[#999]">本地开发</span>
                  <div className="h-px flex-1 bg-[#eaeaea]" />
                </div>
              )}
              <input value={name} onChange={e => setName(e.target.value)} placeholder="你的名字（可选）"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#7C3AED] transition-colors" />
              <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && signInDev()}
                placeholder="邮箱地址" type="email"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border-[1.5px] border-[#e5e5e5] focus:border-[#7C3AED] transition-colors" />
              <button onClick={signInDev} disabled={loading || !email.trim()}
                className={`w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50 ${hasGoogle ? 'border border-[#dcdcdc] hover:bg-[#fafafa]' : 'text-white bg-[#7C3AED] hover:bg-[#6D28D9]'}`}>
                {loading ? '登录中...' : hasGoogle ? '本地邮箱登录（开发）' : '继续'}
              </button>
            </>
          )}
        </div>
        {error && <p className="text-center text-xs mt-4 text-[#d12f2f]">{error}</p>}
        <p className="text-center text-xs mt-4 text-[#999]">首次使用将自动创建账号</p>
      </div>
    </div>
  );
}
