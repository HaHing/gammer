import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function ensureProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return Boolean(project);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const slideIndex = searchParams.get('slideIndex');

  if (!projectId || slideIndex === null) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const owned = await ensureProjectOwnership(projectId, userId);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const versions = await prisma.diagramVersion.findMany({
    where: { projectId, slideIndex: Number(slideIndex) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, label: true, createdAt: true },
  });

  return NextResponse.json(versions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const { projectId, slideIndex, xml, label } = await req.json() as {
    projectId: string;
    slideIndex: number;
    xml: string;
    label?: string;
  };

  const owned = await ensureProjectOwnership(projectId, userId);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const version = await prisma.diagramVersion.create({
    data: { projectId, slideIndex, xml, label },
  });

  // Keep only 50 most recent versions per slide
  const old = await prisma.diagramVersion.findMany({
    where: { projectId, slideIndex },
    orderBy: { createdAt: 'desc' },
    skip: 50,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.diagramVersion.deleteMany({ where: { id: { in: old.map(v => v.id) } } });
  }

  return NextResponse.json(version);
}
