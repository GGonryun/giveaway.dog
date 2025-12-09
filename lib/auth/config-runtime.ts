import prisma from '@/lib/prisma';
import { NextAuthConfig } from 'next-auth';
import { tryAutoMerge } from './auto-merge';
import { authConfigMiddleware } from './config-middleware';
import { getAccountLabel, getAccountLink } from './get-account-data';
import { auth } from './config';
import { pickRandom } from '../arrays';
import { DOG_BREEDS } from '../dogs';
export const authConfig = {
  ...authConfigMiddleware,
  events: {
    async linkAccount({ user, account, profile }) {
      console.log('linkAccount event for provider:', account, user, profile);
      const label = getAccountLabel(account, profile);
      const link = getAccountLink(account, profile);

      await prisma.$transaction(async (tx) => {
        if (label || link) {
          await tx.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            },
            data: { label, link }
          });
        }
        // upgrade anonymous user to verified signed up user.
        if (user.id && 'source' in user && user.source === 'ANONYMOUS') {
          await tx.user.update({
            where: { id: user.id },
            data: {
              source: 'SIGNUP',
              name: profile.name || pickRandom(DOG_BREEDS)
            }
          });
        }
      });
    }
  },
  callbacks: {
    ...authConfigMiddleware.callbacks,
    async signIn({ account, profile, user }) {
      console.log('signIn callback for provider:', account?.provider);
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

        console.log('Existing account found:', !!existing);

        const session = await auth();
        console.log('Current session user ID:', session?.user);

        if (existing) {
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
            // if we are connecting an anonymous user, then there's not going to be an account and this will throw.
            // allowing the anonymous user to upgrade to a full account is handled in linkAccount event
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
