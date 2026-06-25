import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) token.id = user.id;
      return token;
    },
  },
} satisfies NextAuthConfig;
