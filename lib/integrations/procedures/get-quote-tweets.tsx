'use server';

import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import {
  QuoteTweetsRequest,
  QuoteTweetsResponse,
  quoteTweetsResponseSchema
} from '../schemas/api';

export const getQuoteTweets = async (
  tx: Tx,
  input: QuoteTweetsRequest & { maxResults: number; teamId: string }
): Promise<QuoteTweetsResponse> => {
  const params = new URLSearchParams({
    max_results: '100',
    expansions: 'author_id',
    'tweet.fields': 'created_at,author_id,public_metrics',
    'user.fields':
      'created_at,description,id,location,name,profile_banner_url,profile_image_url,protected,public_metrics,url,username,verified,verified_type'
  });

  if (input.paginationToken) {
    params.append('pagination_token', input.paginationToken);
  }

  return twitterApiRequest({
    tx,
    teamId: input.teamId,
    endpoint: `https://api.x.com/2/tweets/${input.tweetId}/quote_tweets`,
    params,
    responseSchema: quoteTweetsResponseSchema
  });
};
