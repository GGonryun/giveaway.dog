'use server';

import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { JoseKey } from '@atproto/jwk-jose';
import prisma from '@/lib/prisma';
import { REQUIRED_BLUESKY_SCOPES } from '@/lib/integrations/scopes';

let teamBlueskyClient: NodeOAuthClient | null = null;

const locks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  while (locks.has(key)) {
    await locks.get(key);
  }

  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  locks.set(key, lockPromise);

  return () => {
    locks.delete(key);
    releaseLock!();
  };
}

/**
 * Get or create the Bluesky OAuth client instance for team-level integrations.
 * Unlike the user-level client, this stores sessions in the Integration table.
 */
export async function getTeamBlueskyClient() {
  if (teamBlueskyClient) return teamBlueskyClient;

  if (!process.env.BLUESKY_PRIVATE_KEY) {
    throw new Error('BLUESKY_PRIVATE_KEY environment variable is required');
  }

  if (!process.env.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL environment variable is required');
  }

  const privateKeyJwk = JSON.parse(process.env.BLUESKY_PRIVATE_KEY);
  const kid = privateKeyJwk.kid || 'key1';

  const keyset = await Promise.all([
    JoseKey.fromImportable(privateKeyJwk, kid)
  ]);

  teamBlueskyClient = new NodeOAuthClient({
    clientMetadata: {
      client_id: `${process.env.NEXTAUTH_URL}/api/bluesky/client-metadata.json`,
      client_name: 'Giveaway.dog',
      client_uri: process.env.NEXTAUTH_URL,
      logo_uri: `${process.env.NEXTAUTH_URL}/logo.png`,
      redirect_uris: [`${process.env.NEXTAUTH_URL}/api/bluesky/team/callback`],
      grant_types: ['authorization_code', 'refresh_token'],
      scope: REQUIRED_BLUESKY_SCOPES.join(' '),
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'ES256',
      dpop_bound_access_tokens: true,
      jwks_uri: `${process.env.NEXTAUTH_URL}/api/bluesky/jwks.json`
    },
    keyset,

    stateStore: {
      async set(key, state) {
        await prisma.state.create({
          data: {
            id: key,
            value: state,
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
          }
        });
      },
      async get(key) {
        const record = await prisma.state.findUnique({ where: { id: key } });
        if (!record || record.expiresAt < new Date()) return undefined;
        return record.value as any;
      },
      async del(key) {
        await prisma.state.delete({ where: { id: key } }).catch(() => {});
      }
    },

    sessionStore: {
      async set(sub: string, session: unknown) {
        const release = await acquireLock(`session:${sub}`);
        try {
          await prisma.integration.upsert({
            where: {
              provider_account_id: {
                provider: 'BLUESKY',
                account_id: sub
              }
            },
            create: {
              provider: 'BLUESKY',
              account_id: sub,
              session_state: JSON.stringify(session)
            },
            update: {
              session_state: JSON.stringify(session)
            }
          });
        } finally {
          release();
        }
      },
      async get(sub: string) {
        const integration = await prisma.integration.findFirst({
          where: {
            provider: 'BLUESKY',
            account_id: sub
          }
        });

        if (!integration?.session_state) return undefined;

        try {
          return JSON.parse(integration.session_state);
        } catch (error) {
          console.error('Failed to parse session_state:', error);
          return undefined;
        }
      },
      async del(sub: string) {
        const release = await acquireLock(`session:${sub}`);
        try {
          await prisma.integration
            .updateMany({
              where: {
                provider: 'BLUESKY',
                account_id: sub
              },
              data: {
                session_state: null
              }
            })
            .catch(() => {});
        } finally {
          release();
        }
      }
    }
  });

  return teamBlueskyClient;
}
