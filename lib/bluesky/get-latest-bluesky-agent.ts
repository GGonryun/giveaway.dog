'use server';

import { getBlueskyClient } from '@/lib/bluesky/bluesky-client';
import { ApplicationError } from '@/lib/errors';
import { Agent } from '@atproto/api';
import { PrismaClient } from '@prisma/client';

export interface BlueskyCredentials {
  agent: Agent;
  did: string;
  handle: string | null;
}

/**
 * Get the latest Bluesky credentials for a user from the database.
 * This creates an authenticated Agent from the stored OAuth session.
 *
 * @param db - Prisma database client
 * @param userId - The user's ID in the database
 * @returns Bluesky credentials including authenticated Agent, DID, and handle
 * @throws ApplicationError if the user doesn't have a Bluesky account or valid session
 */
export async function getLatestBlueskyCredentials(
  db: PrismaClient,
  userId: string
): Promise<BlueskyCredentials> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'bluesky'
    }
  });

  if (!account) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User does not have a connected Bluesky account'
    });
  }

  if (!account.session_state) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message:
        'Bluesky session data not found. Please reconnect your Bluesky account.'
    });
  }

  const client = await getBlueskyClient();

  try {
    // Restore the session using the OAuth client
    // This will load the session from the sessionStore and handle token refresh if needed
    const session = await client.restore(account.providerAccountId);

    // Create an authenticated Agent from the session
    const agent = new Agent(session);

    return {
      agent,
      did: account.providerAccountId,
      handle: account.label ?? null
    };
  } catch (error) {
    console.error('Failed to restore Bluesky session:', error);
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message:
        'Failed to restore Bluesky session. Please reconnect your Bluesky account.',
      cause: error
    });
  }
}
