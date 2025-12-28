'use server';

import { ApplicationError } from '@/lib/errors';
import { PrismaClient } from '@prisma/client';
import { getLatestBlueskyCredentials } from './get-latest-bluesky-agent';

/**
 * Check if the authenticated user has reposted a specific Bluesky post.
 * Uses the AT Protocol API to check the repost status via getPostThread.
 *
 * @param postUrl - The bsky.app URL of the post (e.g., "https://bsky.app/profile/user.bsky.social/post/abc123")
 * @param agent - Authenticated Bluesky Agent
 * @returns true if the authenticated user has reposted the post, false otherwise
 * @throws ApplicationError if the API request fails
 */
export async function isUserRepostingPost(
  db: PrismaClient,
  args: {
    userId: string;
    postUrl: string;
  }
): Promise<boolean> {
  try {
    const { userId, postUrl } = args;
    const { agent } = await getLatestBlueskyCredentials(db, userId);

    const uri = await convertBskyUrlToUri(agent, postUrl);

    const threadResponse = await agent.getPostThread({
      uri,
      depth: 0
    });

    if (!('post' in threadResponse.data.thread)) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    if (
      !threadResponse.success ||
      threadResponse.data.thread.post === undefined
    ) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    const post = threadResponse.data.thread.post;
    return post.viewer?.repost !== undefined;
  } catch (error) {
    console.error('Error checking Bluesky repost status:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check Bluesky repost status',
      cause: error
    });
  }
}

/**
 * Convert a bsky.app URL to AT URI format
 * Example: https://bsky.app/profile/user.bsky.social/post/abc123
 * Returns: at://did:plc:xxx/app.bsky.feed.post/abc123
 */
async function convertBskyUrlToUri(
  agent: any,
  postUrl: string
): Promise<string> {
  const match = postUrl.match(/bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?]+)/);
  if (!match) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid Bluesky post URL'
    });
  }

  const [, handle, rkey] = match;

  const profileResponse = await agent.getProfile({ actor: handle });
  if (!profileResponse.success) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Profile not found'
    });
  }

  const did = profileResponse.data.did;
  return `at://${did}/app.bsky.feed.post/${rkey}`;
}
