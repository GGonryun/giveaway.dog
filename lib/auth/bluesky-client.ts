'use server';

import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { JoseKey } from '@atproto/jwk-jose';
import prisma from '@/lib/prisma';
import { REQUIRED_BLUESKY_SCOPES } from '@/lib/integrations/scopes';

let blueskyClient: NodeOAuthClient | null = null;

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
      redirect_uris: [`${process.env.NEXTAUTH_URL}/api/bluesky/callback`],
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
      async set(key: string, state: unknown) {
        await prisma.state.create({
          data: {
            id: key,
            value: state as any,
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

    // Use State model for temporary Bluesky session storage during OAuth flow
    // Session data will be moved to Account.session_state after user is created
    sessionStore: {
      async set(sub: string, session: unknown) {
        const id = `bluesky-session:${sub}`;
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await prisma.state.upsert({
          where: { id },
          create: {
            id,
            value: session as any,
            expiresAt
          },
          update: {
            value: session as any,
            expiresAt
          }
        });
      },
      async get(sub: string) {
        const record = await prisma.state.findUnique({
          where: { id: `bluesky-session:${sub}` }
        });
        if (!record || record.expiresAt < new Date()) return undefined;
        return record.value as any;
      },
      async del(sub: string) {
        await prisma.state
          .delete({ where: { id: `bluesky-session:${sub}` } })
          .catch(() => {});
      }
    }
  });

  return blueskyClient;
}
