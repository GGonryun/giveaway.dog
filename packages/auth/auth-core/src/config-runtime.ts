import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { Account, NextAuthConfig, Session } from 'next-auth';
import { tryAutoMerge } from './auto-merge';
import { authConfigMiddleware } from './config-middleware';
import { getAccountLabel, getAccountLink } from './get-account-data';
import { pickRandom } from '@giveaway/util-collections/arrays';
import { DOG_BREEDS } from './dogs';
import { VERIFIED_EMAIL_PROVIDERS } from '@giveaway/integration-model/scopes';
import { parseAuthProvider } from '@giveaway/integration-model/providers';

export type GetSession = () => Promise<Session | null>;

const toAccountRefresh = (account: Account) => ({
  ...(account.scope && { scope: account.scope }),
  ...(account.access_token && { access_token: account.access_token }),
  ...(account.refresh_token && { refresh_token: account.refresh_token }),
  ...(account.expires_at && { expires_at: account.expires_at }),
  status: 'ACTIVE' as const
});

export const createAuthConfig = (getSession: GetSession) =>
  ({
    ...authConfigMiddleware,
    events: {
      ...authConfigMiddleware.events,
      async linkAccount({ user, account, profile }) {
        console.info('linkAccount event for provider:', account, user, profile);
        const label = getAccountLabel(account, profile, user);
        const link = getAccountLink(account, profile, user);
        const provider = parseAuthProvider(account.provider);

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

          // Check if this is a new user signing up (not linking additional account)
          // and if the provider verifies emails
          if (user.id) {
            const shouldVerifyEmail =
              VERIFIED_EMAIL_PROVIDERS[provider] && profile.email;

            if (shouldVerifyEmail) {
              await tx.user.update({
                where: { id: user.id },
                data: {
                  emailVerified: new Date()
                }
              });
              console.info(
                'Email verified for new user via provider:',
                account.provider
              );
            }
          }
        });
      }
    },
    callbacks: {
      ...authConfigMiddleware.callbacks,
      async signIn({ account, profile }) {
        console.info('signIn callback for provider:', account?.provider);
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

          console.info('Existing account found:', !!existing);

          const session = await getSession();
          console.info('Current session user ID:', session?.user);

          if (!existing) {
            return true;
          }

          const merged = await tryAutoMerge({
            existing,
            account,
            profile,
            session
          });

          if (merged !== false) {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId
                }
              },
              data: toAccountRefresh(account)
            });
          }

          return merged;
        }
        return true;
      }
    }
  }) satisfies NextAuthConfig;
