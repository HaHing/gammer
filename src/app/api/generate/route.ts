import { NextRequest, NextResponse } from 'next/server';
import type { PageCount, StyleTheme, SlideContent } from '@/lib/types';
import { generatePptx } from '@/lib/pptx-engine';
import { conductResearch } from '@/lib/research-engine';
import { generateWithAI } from '@/lib/ai-generator';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { QuotaExceededError, consumeQuotaPages, ensureQuotaForPages } from '@/lib/quota';
import { getExportExpiryDate, sanitizePptxFileName, trimExportErrorMessage } from '@/lib/project-export';

interface PreviewCacheEntry {
  userId: string;
  slides: SlideContent[];
}

const previewCache = new Map<string, PreviewCacheEntry>();

export function cachePreview(id: string, userId: string, slides: SlideContent[]) {
  previewCache.set(id, { userId, slides });
  setTimeout(() => previewCache.delete(id), 120 * 60 * 1000); // 2 hours
}

export function getCachedPreview(id: string, userId: string): SlideContent[] | undefined {
  const entry = previewCache.get(id);
  if (!entry || entry.userId !== userId) return undefined;
  return entry.slides;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  let body: { topic: string; description: string; pageCount: PageCount; theme: StyleTheme; scenes: string; previewId?: string; projectId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
  const { topic, description, pageCount, theme, scenes, previewId, projectId } = body;

  try {
    let slides: SlideContent[];
    if (previewId) {
      const cached = getCachedPreview(previewId, userId);
      if (cached) {
        // Quota already consumed during preview-stream; just use cached slides
        slides = cached;
      } else {
        await ensureQuotaForPages(userId, pageCount);
        const research = await conductResearch(topic, description || '', scenes || '');
        slides = await generateWithAI(topic, description || '', pageCount, theme, scenes || '', research);
        await consumeQuotaPages(userId, slides.length || pageCount);
      }
    } else {
      await ensureQuotaForPages(userId, pageCount);
      const research = await conductResearch(topic, description || '', scenes || '');
      slides = await generateWithAI(topic, description || '', pageCount, theme, scenes || '', research);
      await consumeQuotaPages(userId, slides.length || pageCount);
    }

    const buffer = await generatePptx(slides, theme, topic);

    if (projectId) {
      const owner = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true, title: true },
      });
      if (owner) {
        const bytes = Buffer.from(buffer);
        await prisma.projectExport.upsert({
          where: { projectId: owner.id },
          update: {
            data: bytes,
            size: bytes.byteLength,
            fileName: sanitizePptxFileName(owner.title || topic),
            expiresAt: getExportExpiryDate(),
            lastError: null,
            lastErrorAt: null,
          },
          create: {
            projectId: owner.id,
            data: bytes,
            size: bytes.byteLength,
            fileName: sanitizePptxFileName(owner.title || topic),
            expiresAt: getExportExpiryDate(),
          },
        });
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(topic)}.pptx"`,
      },
    });
  } catch (e: unknown) {
    if (projectId && !(e instanceof QuotaExceededError)) {
      const owner = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true, title: true },
      });
      if (owner) {
        const errorMessage = trimExportErrorMessage((e as Error).message || 'Generation failed');
        await prisma.projectExport.upsert({
          where: { projectId: owner.id },
          update: {
            lastError: errorMessage,
            lastErrorAt: new Date(),
          },
          create: {
            projectId: owner.id,
            fileName: sanitizePptxFileName(owner.title || topic),
            expiresAt: getExportExpiryDate(new Date(0)),
            lastError: errorMessage,
            lastErrorAt: new Date(),
          },
        }).catch(() => {});
        await prisma.projectExportError.create({
          data: {
            projectId: owner.id,
            source: 'generate',
            message: errorMessage,
          },
        }).catch(() => {});
      }
    }

    if (e instanceof QuotaExceededError) {
      return NextResponse.json({ error: e.message, code: 'QUOTA_EXCEEDED', quota: e.detail }, { status: e.status });
    }
    console.error('PPTX generation failed:', e);
    return NextResponse.json({ error: (e as Error).message || 'Generation failed' }, { status: 500 });
  }
}
