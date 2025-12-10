import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';

export const authConfigMiddleware = {
  logger: {
    error(error: any) {
      // Suppress the "no authorization code" error for Steam provider
      // This is expected because Steam uses OpenID 2.0, not OAuth
      if (
        error?.type === 'CallbackRouteError' &&
        error?.cause?.provider === 'steam' &&
        error?.cause?.err.message?.includes('no authorization code')
      ) {
        return;
      }
      console.error('[NextAuth Error]', JSON.stringify(error, null, 2));
    },
    warn(code: any) {
      console.warn('[NextAuth Warn]', code);
    },
    debug(code: any, metadata: any) {
      console.debug('[NextAuth Debug]', code, metadata);
    }
  },
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
      console.log('authorized callback for route:', nextUrl.pathname);
      const connectionRoutes = ['/login'];
      const hostRoutes = ['/app'];
      const sensitiveRoutes = [...hostRoutes, '/account'];
      const isLoggedIn = !!auth?.user;
      console.log('isLoggedIn:', isLoggedIn);

      const isLogoutRoute = nextUrl.pathname.startsWith('/logout');
      console.log('isLogoutRoute:', isLogoutRoute);

      const isConnectionRoute = connectionRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );

      console.log('isConnectionRoute:', isConnectionRoute);

      const isSensitiveRoute = sensitiveRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );

      console.log('isSensitiveRoute:', isSensitiveRoute);
      if (isLogoutRoute && !isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      if (isConnectionRoute && isLoggedIn)
        return Response.redirect(new URL('/', nextUrl));

      if (isSensitiveRoute) return isLoggedIn;

      return true;
    },
    async jwt({ token, user, account }) {
      console.log('jwt callback invoked');
      if (user && user?.id) {
        token.id = user?.id;
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    session({ token, session }) {
      console.log('session callback invoked');
      if (token?.id && session?.user) {
        session.user.id = token.id as string;
      }
      if (token?.provider && session.user) {
        session.user.provider = token.provider as string;
      }
      return session;
    }
  },
  providers: []
} satisfies NextAuthConfig;
