import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, theme: true, pageCount: true, updatedAt: true, scenes: true },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
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
      score: body.score,
      userId: session.user.id,
    },
  });
  return NextResponse.json({ id: project.id });
}
