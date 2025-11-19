import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';

// TODO: fix any
const getAccountLabel = (account: any, profile: any): string | null => {
  switch (account.provider) {
    case 'google':
    case 'email':
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
    case 'steam':
      return profile?.personaname || null;
    case 'twitch':
      return profile?.name || null;
    case 'kick':
      return profile?.username || profile?.name || null;
    default:
      return null;
  }
};

export const authConfig = {
  debug: true,
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
      console.log('[NextAuth Debug]', code, metadata);
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
    async signIn({ account }) {
      if (account?.provider && account?.providerAccountId) {
        try {
          const updateData: {
            scope?: string;
            access_token?: string;
            refresh_token?: string;
            expires_at?: number;
          } = {};

          if (account.scope) updateData.scope = account.scope;
          if (account.access_token)
            updateData.access_token = account.access_token;
          if (account.refresh_token)
            updateData.refresh_token = account.refresh_token;
          if (account.expires_at) updateData.expires_at = account.expires_at;

          if (Object.keys(updateData).length > 0) {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId
                }
              },
              data: updateData
            });
          }
        } catch (error) {
          // Account doesn't exist yet, will be created by linkAccount event
        }
      }
      return true;
    },
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
