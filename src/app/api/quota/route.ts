import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuotaStatus } from '@/lib/quota';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quota = await getQuotaStatus(session.user.id);
  return NextResponse.json(quota);
}
