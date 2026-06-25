import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCurrentUserRecord, isUserAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

type UserRole = 'user' | 'admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const currentUser = await getCurrentUserRecord();
  if (!isUserAdmin(currentUser)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    pageQuota?: number;
    pageUsed?: number;
    grantPages?: number;
    role?: UserRole;
  };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, pageQuota: true, pageUsed: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const toInt = (v: unknown): number | null => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    return Math.max(0, Math.floor(v));
  };

  const role = body.role && ['user', 'admin'].includes(body.role) ? body.role : user.role;
  const pageQuotaInput = toInt(body.pageQuota);
  const pageUsedInput = toInt(body.pageUsed);
  const grantPages = toInt(body.grantPages) ?? 0;

  let nextQuota = pageQuotaInput ?? user.pageQuota;
  nextQuota = Math.max(0, nextQuota + grantPages);

  let nextUsed = pageUsedInput ?? user.pageUsed;
  if (nextUsed > nextQuota) nextUsed = nextQuota;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role,
      pageQuota: nextQuota,
      pageUsed: nextUsed,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      pageQuota: true,
      pageUsed: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ...updated,
    remaining: Math.max(0, updated.pageQuota - updated.pageUsed),
  });
}
