'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { PrismaClient } from '@giveaway/db-model';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { getLatestBlueskyCredentials } from './get-latest-bluesky-agent';
import { toBlueskyPostUri } from './post-uri';
import { blueskyPostThreadSchema } from '../schemas';

/**
 * Check if the authenticated user has liked a specific Bluesky post.
 * Uses the AT Protocol API to check the like status via getPostThread.
 *
 * @param postUrl - The bsky.app URL of the post (e.g., "https://bsky.app/profile/user.bsky.social/post/abc123")
 * @param agent - Authenticated Bluesky Agent
 * @returns true if the authenticated user has liked the post, false otherwise
 * @throws ApplicationError if the API request fails
 */
export async function isUserLikingPost(
  db: PrismaClient,
  args: {
    userId: string;
    postUrl: string;
  }
): Promise<boolean> {
  try {
    const { userId, postUrl } = args;
    const { agent } = await getLatestBlueskyCredentials(db, userId);

    const uri = await toBlueskyPostUri(agent, postUrl);

    const threadResponse = await agent.getPostThread({
      uri,
      depth: 0
    });

    const { thread } = parseProviderResponse({
      provider: 'bluesky',
      call: 'app.bsky.feed.getPostThread',
      schema: blueskyPostThreadSchema,
      data: threadResponse.data
    });

    if (!threadResponse.success || thread.post === undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    return thread.post.viewer?.like !== undefined;
  } catch (error) {
    console.error('Error checking Bluesky like status:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check Bluesky like status',
      cause: error
    });
  }
}
