'use server';

import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import {
  RetweetedByRequest,
  RetweetedByResponse,
  retweetedByResponseSchema
} from '../schemas/api';
import { extractTweetId } from '../schemas/twitter';
import { ApplicationError } from '@/lib/errors';

export const getRetweetedBy = async (
  tx: Tx,
  input: RetweetedByRequest & { maxResults: number; teamId: string | null }
): Promise<RetweetedByResponse> => {
  if (!input.teamId)
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing required parameter teamId'
    });

  const params = new URLSearchParams({
    max_results: input.maxResults.toString(),
    'user.fields':
      'created_at,description,id,location,name,profile_banner_url,profile_image_url,protected,public_metrics,url,username,verified,verified_type'
  });

  if (input.paginationToken) {
    params.append('pagination_token', input.paginationToken);
  }

  const tweetId = extractTweetId(input.tweetId);

  return twitterApiRequest({
    tx,
    teamId: input.teamId,
    endpoint: `https://api.x.com/2/tweets/${tweetId}/retweeted_by`,
    params,
    responseSchema: retweetedByResponseSchema
  });
};
