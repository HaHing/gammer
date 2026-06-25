import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePptx } from '@/lib/pptx-engine';
import type { SlideContent, StyleTheme } from '@/lib/types';
import {
  asPptxResponse,
  getExportExpiryDate,
  sanitizePptxFileName,
  trimExportErrorMessage,
} from '@/lib/project-export';

function parseSlides(raw: string | null): SlideContent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SlideContent[]) : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      theme: true,
      slides: true,
      latestExport: {
        select: {
          data: true,
          fileName: true,
          expiresAt: true,
        },
      },
    },
  });
  if (!project) return NextResponse.json({ error: '项目不存在或无权限' }, { status: 404 });

  const now = new Date();
  const cached = project.latestExport;
  if (cached?.data && cached.expiresAt > now) {
    const response = asPptxResponse(cached.data, cached.fileName || sanitizePptxFileName(project.title));
    response.headers.set('X-Download-Source', 'cache');
    response.headers.set('X-Download-Expires-At', cached.expiresAt.toISOString());
    return response;
  }

  const slides = parseSlides(project.slides);
  if (!slides.length) {
    return NextResponse.json({ error: '项目尚未生成可下载内容，请先完成生成。' }, { status: 400 });
  }

  try {
    const theme = (project.theme || 'brand') as StyleTheme;
    const buffer = await generatePptx(slides, theme, project.title || 'presentation');
    const bytes = Buffer.from(buffer);
    const fileName = sanitizePptxFileName(project.title);
    const expiresAt = getExportExpiryDate();

    await prisma.projectExport.upsert({
      where: { projectId: project.id },
      update: {
        data: bytes,
        size: bytes.byteLength,
        fileName,
        expiresAt,
        lastError: null,
        lastErrorAt: null,
      },
      create: {
        projectId: project.id,
        data: bytes,
        size: bytes.byteLength,
        fileName,
        expiresAt,
      },
    });

    const response = asPptxResponse(bytes, fileName);
    response.headers.set('X-Download-Source', 'rebuild');
    response.headers.set('X-Download-Expires-At', expiresAt.toISOString());
    return response;
  } catch (error) {
    const message = trimExportErrorMessage((error as Error).message || 'Download failed');
    await prisma.projectExport.upsert({
      where: { projectId: project.id },
      update: {
        lastError: message,
        lastErrorAt: new Date(),
      },
      create: {
        projectId: project.id,
        fileName: sanitizePptxFileName(project.title),
        expiresAt: new Date(0),
        lastError: message,
        lastErrorAt: new Date(),
      },
    }).catch(() => {});
    await prisma.projectExportError.create({
      data: {
        projectId: project.id,
        source: 'download',
        message,
      },
    }).catch(() => {});
    return NextResponse.json({ error: `下载失败：${message}` }, { status: 500 });
  }
}
