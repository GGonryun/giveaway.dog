'use server';

import z from 'zod';
import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';

const twitterUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  created_at: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  profile_image_url: z.string().optional(),
  profile_banner_url: z.string().optional(),
  protected: z.boolean().optional(),
  verified: z.boolean().optional(),
  verified_type: z.string().optional(),
  public_metrics: z
    .object({
      followers_count: z.number(),
      following_count: z.number(),
      tweet_count: z.number(),
      listed_count: z.number()
    })
    .optional()
});

const likingUsersResponseSchema = z.object({
  data: z.array(twitterUserSchema).optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional()
    })
    .optional()
});

export type TwitterUser = z.infer<typeof twitterUserSchema>;
export type LikingUsersResponse = z.infer<typeof likingUsersResponseSchema>;
const likingUsersRequest = z.object({
  teamId: z.string(),
  tweetId: z.string(),
  maxResults: z.number().min(1).max(100).default(100),
  paginationToken: z.string().optional()
});
type LikingUsersRequest = z.infer<typeof likingUsersRequest>;

export const getLikingUsers = async (
  tx: Tx,
  input: LikingUsersRequest
): Promise<LikingUsersResponse> => {
  const params = new URLSearchParams({
    max_results: input.maxResults.toString(),
    'user.fields':
      'created_at,description,id,location,name,profile_banner_url,profile_image_url,protected,public_metrics,url,username,verified,verified_type'
  });

  if (input.paginationToken) {
    params.append('pagination_token', input.paginationToken);
  }

  return twitterApiRequest({
    tx,
    teamId: input.teamId,
    endpoint: `https://api.x.com/2/tweets/${input.tweetId}/liking_users`,
    params,
    responseSchema: likingUsersResponseSchema
  });
};
