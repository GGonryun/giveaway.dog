import 'server-only';

import CredentialsProvider from 'next-auth/providers/credentials';
import { UserAccountType } from '@giveaway/db-model';
import prisma from '@giveaway/db-client/prisma';
import { getE2eSecret, verifyE2eSecret } from '@giveaway/e2e-gate/gate';

export const E2E_USER_EMAIL = 'e2e-host@example.com';

export const newE2eProviders = () => {
  if (!getE2eSecret()) return [];

  return [
    CredentialsProvider({
      id: 'e2e',
      name: 'E2E',
      credentials: { secret: { label: 'Secret', type: 'password' } },
      authorize: async (credentials) => {
        if (!verifyE2eSecret(credentials.secret)) return null;

        return await prisma.user.upsert({
          where: { email: E2E_USER_EMAIL },
          update: { accountType: UserAccountType.HOST, onboarded: true },
          create: {
            email: E2E_USER_EMAIL,
            emailVerified: new Date(),
            name: 'E2E Host',
            accountType: UserAccountType.HOST,
            onboarded: true
          }
        });
      }
    })
  ];
};
