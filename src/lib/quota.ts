import { prisma } from '@/lib/prisma';

export class QuotaExceededError extends Error {
  status: number;
  detail: { total: number; used: number; remaining: number; requested: number };

  constructor(message: string, detail: { total: number; used: number; remaining: number; requested: number }) {
    super(message);
    this.name = 'QuotaExceededError';
    this.status = 402;
    this.detail = detail;
  }
}

export interface QuotaStatus {
  total: number;
  used: number;
  remaining: number;
}

function normalizePages(pages: unknown): number {
  const numeric =
    typeof pages === 'number'
      ? pages
      : typeof pages === 'string'
        ? Number(pages)
        : Number.NaN;
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pageQuota: true, pageUsed: true },
  });
  const total = normalizePages(user?.pageQuota ?? 10);
  const used = normalizePages(user?.pageUsed ?? 0);
  const remaining = Math.max(0, total - used);
  return { total, used, remaining };
}

export async function ensureQuotaForPages(userId: string, requestedPages: number): Promise<QuotaStatus> {
  const requested = normalizePages(requestedPages);
  const quota = await getQuotaStatus(userId);
  if (requested > quota.remaining) {
    throw new QuotaExceededError(
      `配额不足：剩余 ${quota.remaining} 页，需要 ${requested} 页`,
      {
        total: quota.total,
        used: quota.used,
        remaining: quota.remaining,
        requested,
      }
    );
  }
  return quota;
}

export async function consumeQuotaPages(userId: string, pages: number): Promise<QuotaStatus> {
  const requested = normalizePages(pages);
  if (requested <= 0) return getQuotaStatus(userId);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { pageQuota: true, pageUsed: true },
    });
    const total = normalizePages(user?.pageQuota ?? 10);
    const used = normalizePages(user?.pageUsed ?? 0);
    const remaining = Math.max(0, total - used);

    if (requested > remaining) {
      throw new QuotaExceededError(
        `配额不足：剩余 ${remaining} 页，需要 ${requested} 页`,
        { total, used, remaining, requested }
      );
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { pageUsed: { increment: requested } },
      select: { pageQuota: true, pageUsed: true },
    });

    const nextTotal = normalizePages(updated.pageQuota);
    const nextUsed = normalizePages(updated.pageUsed);
    return {
      total: nextTotal,
      used: nextUsed,
      remaining: Math.max(0, nextTotal - nextUsed),
    };
  });
}
