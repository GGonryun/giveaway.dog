import 'server-only';

import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@giveaway/db-client/prisma';
import { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type {} from './next-auth';
import {
  isSessionRevoked,
  newSessionId,
  revokeSession
} from './session-revocation';

const prismaAdapter = PrismaAdapter(prisma);

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
    ...prismaAdapter,
    async getUserByEmail(email) {
      if (!email) return null;
      const user = await prisma.user.findFirst({
        where: { email, emailVerified: { not: null } }
      });
      if (user?.email) return { ...user, email: user.email };
      return null;
    },
    async createUser(user) {
      if (user.email) {
        await prisma.user.updateMany({
          where: { email: user.email, emailVerified: null },
          data: { email: null }
        });
      }
      return prismaAdapter.createUser!(user);
    }
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const connectionRoutes = ['/login'];
      const hostRoutes = ['/app'];
      const sensitiveRoutes = [...hostRoutes, '/account'];
      const isLoggedIn = !!auth?.user;

      const isLogoutRoute = nextUrl.pathname.startsWith('/logout');
      const isOnboardingRoute = nextUrl.pathname.startsWith('/onboarding');
      const isPortalRoute = nextUrl.pathname.startsWith('/portal');

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

      // Check if user needs onboarding (only for specific routes)
      const onboardingRequiredRoutes = [
        '/account',
        '/app',
        '/browse',
        '/pickers'
      ];
      const roleHomeRoutes = ['/app', '/browse'];
      const requiresOnboarding = onboardingRequiredRoutes.some((r) =>
        nextUrl.pathname.startsWith(r)
      );

      if (
        isLoggedIn &&
        requiresOnboarding &&
        !isOnboardingRoute &&
        !isPortalRoute
      ) {
        const userOnboarded = auth.user?.onboarded;

        // If user is not onboarded, redirect to onboarding
        if (userOnboarded === false) {
          const onboardingUrl = new URL('/onboarding', nextUrl);
          if (!roleHomeRoutes.includes(nextUrl.pathname)) {
            onboardingUrl.searchParams.set(
              'redirectTo',
              `${nextUrl.pathname}${nextUrl.search}`
            );
          }
          return Response.redirect(onboardingUrl);
        }
      }

      // Check if user is trying to access host dashboard without HOST account type
      const isHostDashboard = nextUrl.pathname.startsWith('/app');
      if (
        isLoggedIn &&
        isHostDashboard &&
        !isOnboardingRoute &&
        !isPortalRoute
      ) {
        const isHost = auth.user?.accountType === 'HOST';

        if (!isHost) {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      if (isSensitiveRoute) return isLoggedIn;

      return true;
    },
    async jwt({ token, user, account, trigger }) {
      const isNewSession = trigger === 'signIn' || trigger === 'signUp';

      if (isNewSession) {
        token.sid = newSessionId();
        token.signedInAt = Date.now();
      } else if (await isSessionRevoked(token)) {
        return null;
      }

      token.sid ??= newSessionId();

      if (user && user?.id) {
        token.id = user?.id;
      }

      if (account) {
        token.provider = account.provider;
      }

      // Fetch user data on login, sign-up or update
      if (isNewSession || trigger === 'update') {
        if (token.id) {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              onboarded: true,
              accountType: true,
              username: true
            }
          });

          if (userData) {
            token.onboarded = userData.onboarded;
            token.accountType = userData.accountType;
            token.username = userData.username;
          }
        }
      }

      return token;
    },
    session({ token, session }) {
      if (session?.user) {
        const user = session.user as typeof session.user & {
          onboarded?: boolean;
          accountType?: typeof token.accountType;
          username?: string | null;
        };

        user.id = (token?.id as string) ?? user.id;
        user.provider =
          (token?.provider as string | undefined) ?? user.provider;
        user.onboarded =
          (token?.onboarded as boolean | undefined) ?? user.onboarded;
        user.accountType =
          (token?.accountType as typeof user.accountType) ?? user.accountType;
        user.username =
          (token?.username as string | null | undefined) ?? user.username;
      }
      return session;
    }
  },
  events: {
    async signOut({ token }: { token?: JWT | null; session?: unknown }) {
      await revokeSession(token);
    }
  },
  providers: []
} satisfies NextAuthConfig;
