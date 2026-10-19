'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';
import { blueskyProfileSchema, blueskyRepostedBySchema } from './schemas';

export interface BlueskyUserSchema {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BlueskyRepostsRequest {
  postUrl: string;
  agent: Agent;
  cursor?: string;
}

export interface BlueskyRepostsResponse {
  data?: BlueskyUserSchema[];
  cursor?: string;
}

export const getBlueskyReposts = async (
  tx: Tx,
  input: BlueskyRepostsRequest
): Promise<BlueskyRepostsResponse> => {
  const { agent } = input;

  const uri = await convertBskyUrlToUri(agent, input.postUrl);

  try {
    const response = await agent.api.app.bsky.feed.getRepostedBy({
      uri,
      limit: 100,
      cursor: input.cursor
    });

    const page = blueskyRepostedBySchema.parse(response.data);

    const reposts: BlueskyUserSchema[] = page.repostedBy.map((actor) => ({
      did: actor.did,
      handle: actor.handle,
      displayName: actor.displayName ?? undefined,
      avatar: actor.avatar ?? undefined
    }));

    return {
      data: reposts,
      cursor: page.cursor ?? undefined
    };
  } catch (error) {
    console.error('Error fetching Bluesky reposts:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Bluesky reposts',
      cause: error
    });
  }
};

async function convertBskyUrlToUri(
  agent: Agent,
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

  const profile = blueskyProfileSchema.safeParse(profileResponse.data);
  if (!profile.success) {
    throw new ApplicationError({
      code: 'BAD_GATEWAY',
      message: 'Invalid Bluesky profile response',
      cause: profile.error
    });
  }

  return `at://${profile.data.did}/app.bsky.feed.post/${rkey}`;
}
