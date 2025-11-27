import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';
import { tryAutoMerge } from './auto-merge';
import { authConfigMiddleware } from './config-middleware';
import { getCookieSession } from './get-cookie-session';
import { getAccountLabel, getAccountLink } from './get-account-data';

export const authConfig = {
  ...authConfigMiddleware,
  events: {
    async linkAccount({ account, profile }) {
      const label = getAccountLabel(account, profile);
      const link = getAccountLink(account, profile);
      if (label || link) {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          data: { label, link }
        });
      }
    }
  },
  callbacks: {
    ...authConfigMiddleware.callbacks,
    async signIn({ account, user, profile }) {
      console.log('[Auth] signIn callback triggered:', {
        account,
        user,
        profile
      });
      if (profile && account?.provider && account?.providerAccountId) {
        // Check if this account already exists (imported user scenario)
        const existing = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          include: {
            user: {
              select: { id: true, source: true, name: true, email: true }
            }
          }
        });

        console.log('Existing account:', existing);
        const session = await getCookieSession();
        console.log('Current session:', session);
        if (existing && session) {
          console.log('Attempting auto-merge for account sign-in');
          return await tryAutoMerge({
            existing,
            account,
            profile,
            session
          });
        }

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
    }
  }
} satisfies NextAuthConfig;
