import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getExportRetentionDays } from '@/lib/project-export';
import { QuotaExceededError, ensureQuotaForPages } from '@/lib/quota';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date();
  const errorSince = new Date(now.getTime() - getExportRetentionDays() * 24 * 60 * 60 * 1000);
  const errorCounts = await prisma.projectExportError.groupBy({
    by: ['projectId'],
    where: {
      project: { userId: session.user.id },
      createdAt: { gte: errorSince },
    },
    _count: {
      _all: true,
    },
  });
  const errorCountByProject = new Map(errorCounts.map((item) => [item.projectId, item._count._all]));

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      theme: true,
      pageCount: true,
      updatedAt: true,
      scenes: true,
      slides: true,
      latestExport: {
        select: {
          size: true,
          expiresAt: true,
          updatedAt: true,
          lastError: true,
          lastErrorAt: true,
        },
      },
      exportErrors: {
        where: { createdAt: { gte: errorSince } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          source: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });
  return NextResponse.json(
    projects.map((p) => {
      const exportMeta = p.latestExport;
      const latestHistoryError = p.exportErrors[0] ?? null;
      return {
        id: p.id,
        title: p.title,
        theme: p.theme,
        pageCount: p.pageCount,
        updatedAt: p.updatedAt,
        scenes: p.scenes,
        hasSlides: Boolean(p.slides),
        downloadReady: Boolean(exportMeta && exportMeta.expiresAt > now),
        downloadUntil: exportMeta?.expiresAt ?? null,
        lastExportAt: exportMeta?.updatedAt ?? null,
        lastExportSize: exportMeta?.size ?? 0,
        lastDownloadError: exportMeta?.lastError ?? latestHistoryError?.message ?? null,
        lastDownloadErrorAt: exportMeta?.lastErrorAt ?? latestHistoryError?.createdAt ?? null,
        downloadErrorCount: errorCountByProject.get(p.id) ?? 0,
        downloadErrorHistory: p.exportErrors,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    await ensureQuotaForPages(session.user.id, body.pageCount ?? 10);
    const project = await prisma.project.create({
      data: {
        title: body.title || 'Untitled',
        description: body.description,
        theme: body.theme || 'brand',
        paletteIdx: body.paletteIdx || 0,
        pageCount: body.pageCount || 10,
        lang: body.lang || 'zh',
        scenes: body.scenes,
        slides: body.slides ? JSON.stringify(body.slides) : null,
        outline: body.outline ? JSON.stringify(body.outline) : null,
        research: body.research ? JSON.stringify(body.research) : null,
        delivery: body.delivery ? JSON.stringify(body.delivery) : null,
        score: body.score,
        userId: session.user.id,
      },
    });
    return NextResponse.json({ id: project.id });
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return NextResponse.json({ error: e.message, code: 'QUOTA_EXCEEDED', quota: e.detail }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message || '创建项目失败' }, { status: 500 });
  }
}
