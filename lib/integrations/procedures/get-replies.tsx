'use server';

import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import {
  RepliedByRequest,
  RepliedByResponse,
  repliedByResponseSchema
} from '../schemas/api';
import { extractTweetId } from '../schemas/twitter';
import { z } from 'zod';

const conversationIdResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      conversation_id: z.string()
    })
  )
});

export const getRepliesTo = async (
  tx: Tx,
  input: RepliedByRequest & {
    maxResults: number;
    teamId: string;
    integrationId?: string;
  }
): Promise<RepliedByResponse> => {
  const tweetId = extractTweetId(input.tweetId);

  const conversationParams = new URLSearchParams({
    ids: tweetId,
    'tweet.fields': 'conversation_id'
  });

  const conversationResponse = await twitterApiRequest({
    tx,
    teamId: input.teamId,
    integrationId: input.integrationId,
    endpoint: 'https://api.x.com/2/tweets',
    params: conversationParams,
    responseSchema: conversationIdResponseSchema
  });

  const conversationId = conversationResponse.data[0]?.conversation_id;

  if (!conversationId) {
    return {
      data: [],
      meta: {
        result_count: 0
      }
    };
  }

  const searchParams = new URLSearchParams({
    query: `conversation_id:${conversationId}`,
    max_results: input.maxResults.toString(),
    expansions: 'author_id',
    'tweet.fields':
      'created_at,author_id,public_metrics,referenced_tweets,conversation_id,in_reply_to_user_id',
    'user.fields':
      'created_at,description,id,location,name,profile_banner_url,profile_image_url,protected,public_metrics,url,username,verified,verified_type'
  });

  if (input.paginationToken) {
    searchParams.append('next_token', input.paginationToken);
  }

  const response = await twitterApiRequest({
    tx,
    teamId: input.teamId,
    integrationId: input.integrationId,
    endpoint: 'https://api.x.com/2/tweets/search/recent',
    params: searchParams,
    responseSchema: repliedByResponseSchema
  });

  const filteredData = response.data?.filter((tweet) => {
    const directReplyTo = tweet.referenced_tweets?.find(
      (ref) => ref.type === 'replied_to'
    );
    return directReplyTo?.id === tweetId;
  });

  return {
    ...response,
    data: filteredData,
    meta: {
      ...response.meta,
      result_count: filteredData?.length ?? 0
    }
  };
};
