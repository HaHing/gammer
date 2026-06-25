'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.25V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M6.5 6.5l2.8 2.8" />
      <path d="M14.7 14.7l2.8 2.8" />
      <path d="M17.5 6.5l-2.8 2.8" />
      <path d="M9.3 14.7l-2.8 2.8" />
    </svg>
  );
}

export default function UserMenuFab() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (status === 'loading') return null;

  const user = session?.user;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : '用户');
  const initial = displayName.slice(0, 1).toUpperCase();
  const isAdmin = user?.role === 'admin';

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-64 overflow-hidden rounded-2xl border bg-white shadow-[0_12px_28px_rgba(17,24,39,0.14)]" style={{ borderColor: '#E6E8EC' }}>
          {session?.user ? (
            <>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#ECEFF3' }}>
                <p className="text-sm font-semibold text-[#1f2430] truncate">{displayName}</p>
                <p className="text-xs text-[#6b7280] truncate">{user?.email || ''}</p>
              </div>
              <div className="p-1.5">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm text-[#1f2430] hover:bg-[#F4F6FA] flex items-center gap-2">
                  <IconGrid />
                  我的项目
                </Link>
                <Link href="/create" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm text-[#1f2430] hover:bg-[#F4F6FA] flex items-center gap-2">
                  <IconPlus />
                  新建演示
                </Link>
                <Link href="/account" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm text-[#1f2430] hover:bg-[#F4F6FA] flex items-center gap-2">
                  <IconSettings />
                  账号设置
                </Link>
                {isAdmin ? (
                  <Link href="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm text-[#1f2430] hover:bg-[#F4F6FA] flex items-center gap-2">
                    <IconShield />
                    后台管理
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#b42318] hover:bg-[#FFF3F2] flex items-center gap-2"
                >
                  <IconLogout />
                  退出登录
                </button>
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="text-sm font-medium text-[#1f2430] mb-2">登录后管理你的演示项目</p>
              <button
                type="button"
                onClick={() => {
                  router.push('/login?callbackUrl=%2Fdashboard');
                }}
                className="w-full h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9]"
              >
                去登录
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group h-10 pl-1 pr-3 rounded-xl border bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-all flex items-center gap-2"
        style={{ borderColor: '#E6E8EC' }}
        aria-label="用户菜单"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden relative">
          {user?.image ? (
            <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              {session?.user ? initial : <IconSpark />}
            </div>
          )}
          {session?.user ? <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#12B76A]" /> : null}
        </div>
        <div className="leading-tight text-left">
          <p className="text-[10px] text-[#6B7280]">{session?.user ? '已登录' : '未登录'}</p>
          <p className="text-[11px] font-semibold text-[#1F2430] max-w-[112px] truncate">{session?.user ? displayName : '用户中心'}</p>
        </div>
      </button>
    </div>
  );
}
