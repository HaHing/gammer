import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getCurrentUserRecord() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      pageQuota: true,
      pageUsed: true,
    },
  });
  return user;
}

export function isUserAdmin(
  user: { email: string | null; role: string } | null | undefined
): boolean {
  if (!user?.email) return false;
  if (user.role === 'admin') return true;
  const adminEmails = getAdminEmailSet();
  if (adminEmails.has(user.email.toLowerCase())) return true;
  return false;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUserRecord();
  return isUserAdmin(user);
}
