import 'server-only';

import type { Agent } from '@atproto/api';
import { ApplicationError } from '@giveaway/util-errors';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { blueskyProfileSchema } from '../schemas';

export const toBlueskyPostUri = async (
  agent: Agent,
  postUrl: string
): Promise<string> => {
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

  const { did } = parseProviderResponse({
    provider: 'bluesky',
    call: 'app.bsky.actor.getProfile',
    schema: blueskyProfileSchema,
    data: profileResponse.data
  });

  return `at://${did}/app.bsky.feed.post/${rkey}`;
};
