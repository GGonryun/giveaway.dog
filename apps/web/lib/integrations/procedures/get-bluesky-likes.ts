'use server';

import { Tx } from '@/lib/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';

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

    const likes: BlueskyUserSchema[] = response.data.likes.map((like) => ({
      did: like.actor.did,
      handle: like.actor.handle,
      displayName: like.actor.displayName,
      avatar: like.actor.avatar
    }));

    return {
      data: likes,
      cursor: response.data.cursor
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

  const did = profileResponse.data.did;
  return `at://${did}/app.bsky.feed.post/${rkey}`;
}
