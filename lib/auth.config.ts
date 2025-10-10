'server only';

import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';

// TODO: fix any
const getAccountLabel = (account: any, profile: any): string | null => {
  switch (account.provider) {
    case 'google':
    case 'nodemailer':
      return profile?.email || null;
    case 'discord': {
      return (
        profile?.username ||
        profile?.global_name ||
        profile?.name ||
        profile?.email ||
        null
      );
    }
    case 'twitter':
      return profile?.username ? `@${profile.username}` : null;
    default:
      return null;
  }
};

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
  events: {
    async linkAccount({ account, profile }) {
      const label = getAccountLabel(account, profile);
      if (label) {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          data: { label }
        });
      }
    }
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const connectionRoutes = ['/login'];
      const hostRoutes = ['/app'];
      const sensitiveRoutes = [...hostRoutes, '/account'];
      const isLoggedIn = !!auth?.user;

      const isLogoutRoute = nextUrl.pathname.startsWith('/logout');
      const isConnectionRoute = connectionRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );

      const isSensitiveRoute = sensitiveRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );
      if (isLogoutRoute && !isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      if (isConnectionRoute && isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      if (isSensitiveRoute) return isLoggedIn;

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
