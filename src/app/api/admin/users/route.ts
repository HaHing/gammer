import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCurrentUserRecord, isUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getCurrentUserRecord();
    if (!isUserAdmin(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        pageQuota: true,
        pageUsed: true,
        lastLoginAt: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { projects: true } },
      },
    });

    const now = Date.now();
    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const rows = users.map((u) => {
      const lastActiveAtTs = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      const isOnline = lastActiveAtTs > 0 && now - lastActiveAtTs <= ONLINE_WINDOW_MS;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        role: u.role,
        pageQuota: u.pageQuota,
        pageUsed: u.pageUsed,
        remaining: Math.max(0, u.pageQuota - u.pageUsed),
        projectCount: u._count.projects,
        isOnline,
        lastLoginAt: u.lastLoginAt,
        lastActiveAt: u.lastActiveAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return NextResponse.json({
      users: rows,
      summary: {
        totalUsers: rows.length,
        lowQuotaUsers: rows.filter((u) => u.remaining <= 2).length,
        exhaustedUsers: rows.filter((u) => u.remaining <= 0).length,
        onlineUsers: rows.filter((u) => u.isOnline).length,
      },
    });
  } catch (error) {
    console.error('[AdminUsers] GET failed:', error);
    return NextResponse.json(
      { error: `加载用户数据失败: ${(error as Error).message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
