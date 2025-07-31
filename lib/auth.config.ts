'server only';

import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/login?verify=true'
  },
  session: {
    strategy: 'jwt'
  },
  adapter: {
    ...PrismaAdapter(prisma),
    async getUserByEmail(email) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user?.email) return { ...user, email: user.email };
      return null;
    }
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApp = nextUrl.pathname.startsWith('/host');
      if (isApp) return isLoggedIn;
      const isLogout = nextUrl.pathname.startsWith('/logout');
      if (isLogout && !isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));
      const isLogin = nextUrl.pathname.startsWith('/login');
      if (isLogin && isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ token, session }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  providers: []
} satisfies NextAuthConfig;
