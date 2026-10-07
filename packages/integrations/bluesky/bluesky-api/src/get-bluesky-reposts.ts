'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { Agent } from '@atproto/api';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { toBlueskyPostUri } from './bluesky/post-uri';
import { blueskyRepostedBySchema } from './schemas';

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

  const uri = await toBlueskyPostUri(agent, input.postUrl);

  try {
    const response = await agent.api.app.bsky.feed.getRepostedBy({
      uri,
      limit: 100,
      cursor: input.cursor
    });

    const data = parseProviderResponse({
      provider: 'bluesky',
      call: 'app.bsky.feed.getRepostedBy',
      schema: blueskyRepostedBySchema,
      data: response.data
    });

    const reposts: BlueskyUserSchema[] = data.repostedBy.map((actor) => ({
      did: actor.did,
      handle: actor.handle,
      displayName: actor.displayName,
      avatar: actor.avatar
    }));

    return {
      data: reposts,
      cursor: data.cursor
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
