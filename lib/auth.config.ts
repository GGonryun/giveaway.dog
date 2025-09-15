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
      if (!email) return null;
      const user = await prisma.user.findFirst({ where: { email } });
      if (user?.email) return { ...user, email: user.email };
      return null;
    }
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const connectionRoutes = ['/login', '/signup'];
      const sensitiveRoutes = ['/app', '/account'];
      const isLoggedIn = !!auth?.user;

      const isLogout = nextUrl.pathname.startsWith('/logout');
      if (isLogout && !isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      const isConnection = connectionRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );
      if (isConnection && isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      const isSensitive = sensitiveRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );
      if (isSensitive) return isLoggedIn;
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
