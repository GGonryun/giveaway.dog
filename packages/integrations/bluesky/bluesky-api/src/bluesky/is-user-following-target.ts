'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { PrismaClient } from '@giveaway/db-model';
import { getLatestBlueskyCredentials } from './get-latest-bluesky-agent';

/**
 * Check if the authenticated user follows a target user on Bluesky.
 * Uses the AT Protocol API to check the follow relationship.
 *
 * @param targetHandle - The handle or DID of the target user (e.g., "username.bsky.social" or "did:plc:...")
 * @param agent - Authenticated Bluesky Agent
 * @returns true if the authenticated user follows the target, false otherwise
 * @throws ApplicationError if the API request fails
 */
export async function isUserFollowingTarget(
  db: PrismaClient,
  args: {
    userId: string;
    targetHandle: string;
  }
): Promise<boolean> {
  try {
    const { userId, targetHandle } = args;
    const { agent } = await getLatestBlueskyCredentials(db, userId);
    const profileResponse = await agent.getProfile({
      actor: targetHandle
    });

    // Check if viewer.following is defined
    // If it's defined, the authenticated user follows the target
    return profileResponse.data.viewer?.following !== undefined;
  } catch (error) {
    console.error('Error checking Bluesky follow status:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check Bluesky follow status',
      cause: error
    });
  }
}
