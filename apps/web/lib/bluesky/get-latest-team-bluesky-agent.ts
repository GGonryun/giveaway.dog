'use server';

import { getTeamBlueskyClient } from '@/lib/bluesky/team-bluesky-client';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';
import { PrismaClient } from '@prisma/client';
import { Tx } from '../prisma';

export interface BlueskyTeamCredentials {
  agent: Agent;
  did: string;
  handle: string | null;
}

/**
 * Get the latest Bluesky credentials for a team from the database.
 * This creates an authenticated Agent from the stored OAuth session.
 *
 * @param db - Prisma database client
 * @param teamId - The team's ID in the database
 * @returns Bluesky credentials including authenticated Agent, DID, and handle
 * @throws ApplicationError if the team doesn't have a Bluesky integration or valid session
 */
export async function getLatestTeamBlueskyCredentials(
  db: Tx | PrismaClient,
  teamId: string
): Promise<BlueskyTeamCredentials> {
  const integration = await db.integration.findFirst({
    where: {
      teamId,
      provider: 'BLUESKY',
      status: 'ACTIVE'
    }
  });

  if (!integration) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Team does not have a connected Bluesky integration'
    });
  }

  if (!integration.session_state) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message:
        'Bluesky session data not found. Please reconnect your Bluesky integration.'
    });
  }

  if (!integration.account_id) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message:
        'Bluesky account ID not found. Please reconnect your Bluesky integration.'
    });
  }

  const client = await getTeamBlueskyClient();

  try {
    const session = await client.restore(integration.account_id);
    const agent = new Agent(session);

    return {
      agent,
      did: integration.account_id,
      handle: integration.label ?? null
    };
  } catch (error) {
    console.error('Failed to restore Bluesky team session:', error);

    await db.integration.update({
      where: { id: integration.id },
      data: { status: 'ERROR' }
    });

    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message:
        'Failed to restore Bluesky session. Please reconnect your Bluesky integration.',
      cause: error
    });
  }
}
