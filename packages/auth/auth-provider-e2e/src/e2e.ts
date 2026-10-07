import 'server-only';

import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@giveaway/db-client/prisma';
import { getE2eSecret, verifyE2eSecret } from '@giveaway/e2e-gate/gate';
import { toE2eSignInUpsert } from '@giveaway/e2e-model/personas';

export const newE2eProviders = () => {
  if (!getE2eSecret()) return [];

  return [
    CredentialsProvider({
      id: 'e2e',
      name: 'E2E',
      credentials: {
        secret: { label: 'Secret', type: 'password' },
        persona: { label: 'Persona', type: 'text' },
        ns: { label: 'Namespace', type: 'text' }
      },
      authorize: async ({ secret, persona, ns }) => {
        if (!verifyE2eSecret(secret)) return null;

        const upsert = toE2eSignInUpsert({ persona, ns, now: new Date() });
        if (!upsert) return null;

        return await prisma.user.upsert(upsert);
      }
    })
  ];
};
