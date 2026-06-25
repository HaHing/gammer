import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCurrentUserRecord, isUserAdmin } from '@/lib/admin';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fadmin');
  }

  const currentUser = await getCurrentUserRecord();
  if (!isUserAdmin(currentUser)) {
    redirect('/dashboard');
  }

  return <AdminPageClient />;
}
