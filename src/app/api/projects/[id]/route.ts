import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ...project,
    slides: project.slides ? JSON.parse(project.slides) : null,
    outline: project.outline ? JSON.parse(project.outline) : null,
    research: project.research ? JSON.parse(project.research) : null,
    delivery: project.delivery ? JSON.parse(project.delivery) : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.slides !== undefined) data.slides = JSON.stringify(body.slides);
  if (body.outline !== undefined) data.outline = JSON.stringify(body.outline);
  if (body.research !== undefined) data.research = JSON.stringify(body.research);
  if (body.delivery !== undefined) data.delivery = JSON.stringify(body.delivery);
  if (body.score !== undefined) data.score = body.score;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.paletteIdx !== undefined) data.paletteIdx = body.paletteIdx;
  await prisma.project.updateMany({ where: { id, userId: session.user.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.project.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
