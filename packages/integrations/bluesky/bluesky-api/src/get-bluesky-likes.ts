'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';
import { blueskyProfileSchema, blueskyLikesSchema } from './schemas';

export interface BlueskyUserSchema {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  // Enhanced fields for risk scoring (optional for backward compatibility)
  description?: string;
  banner?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  createdAt?: string;
}

export interface BlueskyLikesRequest {
  postUrl: string;
  agent: Agent;
  cursor?: string;
}

export interface BlueskyLikesResponse {
  data?: BlueskyUserSchema[];
  cursor?: string;
}

export const getBlueskyLikes = async (
  tx: Tx,
  input: BlueskyLikesRequest
): Promise<BlueskyLikesResponse> => {
  const { agent } = input;

  const uri = await convertBskyUrlToUri(agent, input.postUrl);

  try {
    const response = await agent.api.app.bsky.feed.getLikes({
      uri,
      limit: 100,
      cursor: input.cursor
    });

    const page = blueskyLikesSchema.parse(response.data);

    const likes: BlueskyUserSchema[] = page.likes.map((like) => ({
      did: like.actor.did,
      handle: like.actor.handle,
      displayName: like.actor.displayName ?? undefined,
      avatar: like.actor.avatar ?? undefined
    }));

    return {
      data: likes,
      cursor: page.cursor ?? undefined
    };
  } catch (error) {
    console.error('Error fetching Bluesky likes:', error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Bluesky likes',
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
