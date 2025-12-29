'use server';

import { Tx } from '@/lib/prisma';
import { ApplicationError } from '@/lib/errors';
import { getLatestTeamBlueskyCredentials } from '@/lib/bluesky/get-latest-team-bluesky-agent';
import { Agent } from '@atproto/api';

export interface BlueskyUserSchema {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BlueskyRepostsRequest {
  postUrl: string;
  teamId: string;
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
  const { agent } = await getLatestTeamBlueskyCredentials(tx, input.teamId);

  const uri = await convertBskyUrlToUri(agent, input.postUrl);

  try {
    const response = await agent.api.app.bsky.feed.getRepostedBy({
      uri,
      limit: 100,
      cursor: input.cursor
    });

    const reposts: BlueskyUserSchema[] = response.data.repostedBy.map(
      (actor) => ({
        did: actor.did,
        handle: actor.handle,
        displayName: actor.displayName,
        avatar: actor.avatar
      })
    );

    return {
      data: reposts,
      cursor: response.data.cursor
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
  const match = postUrl.match(
    /bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?]+)/
  );
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
