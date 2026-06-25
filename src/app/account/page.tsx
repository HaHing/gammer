'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function AccountPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : '用户');

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#1f2430] px-5 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">账号设置</h1>
          <Link href="/dashboard" className="text-sm px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA]">
            返回项目
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E6E8EC] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4 mb-5">
            {user?.image ? (
              <img src={user.image} alt={displayName} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-semibold">{displayName}</p>
              <p className="text-sm text-[#6B7280]">{user?.email || '-'}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex items-center justify-between py-2 border-b border-[#F0F1F4]">
              <span className="text-[#6B7280]">登录方式</span>
              <span>Google / 开发邮箱</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#6B7280]">账号状态</span>
              <span className="text-[#12B76A] font-medium">正常</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="h-10 px-4 rounded-xl bg-[#B42318] text-white text-sm font-semibold hover:bg-[#9e1f15]"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
