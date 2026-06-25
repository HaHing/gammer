import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

const enableDevCredentials = process.env.ENABLE_DEV_CREDENTIALS === 'true' || process.env.NODE_ENV !== 'production';
const hasGoogleOAuth = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: any[] = [];

if (hasGoogleOAuth) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: 'select_account' } },
    })
  );
}

if (enableDevCredentials || !hasGoogleOAuth) {
  providers.push(
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Your name' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const name = (credentials.name as string) || email.split('@')[0];
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email, name } });
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account }) {
      if (!account) return false;
      if (account.provider === 'credentials' && !enableDevCredentials) return false;
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        session.user.role = dbUser?.role === 'admin' ? 'admin' : 'user';
      }
      return session;
    },
  },
});
