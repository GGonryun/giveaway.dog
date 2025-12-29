'use server';

import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { JoseKey } from '@atproto/jwk-jose';
import prisma from '@/lib/prisma';
import { REQUIRED_BLUESKY_SCOPES } from '@/lib/integrations/scopes';

let blueskyClient: NodeOAuthClient | null = null;

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
 * Get or create the Bluesky OAuth client instance.
 * Uses existing NextAuth Account and State models for storage.
 */
export async function getBlueskyClient() {
  if (blueskyClient) return blueskyClient;

  if (!process.env.BLUESKY_PRIVATE_KEY) {
    throw new Error('BLUESKY_PRIVATE_KEY environment variable is required');
  }

  if (!process.env.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL environment variable is required');
  }

  // Parse the private key from environment variable (JWK format)
  const privateKeyJwk = JSON.parse(process.env.BLUESKY_PRIVATE_KEY);

  // Use the kid from the JWK if it exists, otherwise use 'key1'
  const kid = privateKeyJwk.kid || 'key1';

  const keyset = await Promise.all([
    JoseKey.fromImportable(privateKeyJwk, kid)
  ]);

  blueskyClient = new NodeOAuthClient({
    clientMetadata: {
      client_id: `${process.env.NEXTAUTH_URL}/api/bluesky/client-metadata.json`,
      client_name: 'Giveaway.dog',
      client_uri: process.env.NEXTAUTH_URL,
      logo_uri: `${process.env.NEXTAUTH_URL}/logo.png`,
      redirect_uris: [`${process.env.NEXTAUTH_URL}/api/bluesky/user/callback`],
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

    // Use existing NextAuth State model for OAuth state storage
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
      async get(key: string) {
        const record = await prisma.state.findUnique({ where: { id: key } });
        if (!record || record.expiresAt < new Date()) return undefined;
        return record.value as any;
      },
      async del(key: string) {
        await prisma.state.delete({ where: { id: key } }).catch(() => {});
      }
    },

    // Use Account table to store Bluesky sessions
    // Sessions are stored in the session_state field of the Account model
    sessionStore: {
      async set(sub: string, session: unknown) {
        const release = await acquireLock(`session:${sub}`);
        try {
          // sub is the DID (providerAccountId)
          // Create account if it doesn't exist, or update existing account
          // The callback route will later update this with the correct userId
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: 'bluesky',
                providerAccountId: sub
              }
            },
            create: {
              provider: 'bluesky',
              type: 'oauth',
              providerAccountId: sub,
              session_state: JSON.stringify(session)
              // userId will be set by the callback route
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
        // sub is the DID (providerAccountId)
        const account = await prisma.account.findFirst({
          where: {
            provider: 'bluesky',
            providerAccountId: sub
          }
        });

        if (!account?.session_state) return undefined;

        try {
          return JSON.parse(account.session_state);
        } catch (error) {
          console.error('Failed to parse session_state:', error);
          return undefined;
        }
      },
      async del(sub: string) {
        const release = await acquireLock(`session:${sub}`);
        try {
          // sub is the DID (providerAccountId)
          await prisma.account
            .updateMany({
              where: {
                provider: 'bluesky',
                providerAccountId: sub
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

  return blueskyClient;
}
