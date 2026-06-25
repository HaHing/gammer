import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { versionId } = await params;
  const version = await prisma.diagramVersion.findUnique({ where: { id: versionId } });
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const project = await prisma.project.findFirst({
    where: { id: version.projectId, userId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(version);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { versionId } = await params;
  const version = await prisma.diagramVersion.findUnique({ where: { id: versionId } });
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const project = await prisma.project.findFirst({
    where: { id: version.projectId, userId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.diagramVersion.delete({ where: { id: versionId } });
  return NextResponse.json({ ok: true });
}
