import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  const isPublic = pathname === '/'
    || pathname.startsWith('/login')
    || pathname.startsWith('/gallery')
    || pathname.startsWith('/create')
    || pathname.startsWith('/_next')
    || pathname === '/favicon.ico'
    || pathname.startsWith('/api/auth');

  if (isPublic) return;

  const isProtected = pathname.startsWith('/dashboard')
    || pathname.startsWith('/edit')
    || pathname.startsWith('/present')
    || pathname.startsWith('/account')
    || pathname.startsWith('/admin');

  if (!req.auth && isProtected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search || ''}`);
    return Response.redirect(loginUrl);
  }

  if (!req.auth && pathname.startsWith('/api/')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
