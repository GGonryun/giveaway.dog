'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { toBlueskyPostUri } from './bluesky/post-uri';
import { blueskyLikesSchema } from './schemas';

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

  const uri = await toBlueskyPostUri(agent, input.postUrl);

  try {
    const response = await agent.api.app.bsky.feed.getLikes({
      uri,
      limit: 100,
      cursor: input.cursor
    });

    const data = parseProviderResponse({
      provider: 'bluesky',
      call: 'app.bsky.feed.getLikes',
      schema: blueskyLikesSchema,
      data: response.data
    });

    const likes: BlueskyUserSchema[] = data.likes.map((like) => ({
      did: like.actor.did,
      handle: like.actor.handle,
      displayName: like.actor.displayName,
      avatar: like.actor.avatar
    }));

    return {
      data: likes,
      cursor: data.cursor
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
