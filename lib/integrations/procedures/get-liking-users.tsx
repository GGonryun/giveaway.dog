'use server';

import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import {
  LikingUsersRequest,
  LikingUsersResponse,
  likingUsersResponseSchema
} from '../schemas/api';
import { extractTweetId } from '../schemas/twitter';

export const getLikingUsers = async (
  tx: Tx,
  input: LikingUsersRequest & { maxResults: number; teamId: string }
): Promise<LikingUsersResponse> => {
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
    endpoint: `https://api.x.com/2/tweets/${tweetId}/liking_users`,
    params,
    responseSchema: likingUsersResponseSchema
  });
};
