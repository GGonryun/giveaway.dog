'use server';

import { Tx } from '@/lib/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import {
  CreateTweetRequest,
  CreateTweetResponse,
  createTweetResponseSchema
} from '../schemas/api';
import { ApplicationError } from '@/lib/errors';
import { uploadImage } from './upload-image';

interface CreateTweetInput extends CreateTweetRequest {
  teamId: string;
  imageUrl?: string;
}

export const createTweet = async (
  tx: Tx,
  input: CreateTweetInput
): Promise<CreateTweetResponse> => {
  if (!input.teamId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing required parameter teamId'
    });
  }

  const tweetData: CreateTweetRequest = {
    text: input.text
  };

  if (input.imageUrl) {
    const mediaId = await uploadImage(tx, input.teamId, input.imageUrl);
    tweetData.media = {
      media_ids: [mediaId]
    };
  }

  return twitterApiRequest({
    tx,
    teamId: input.teamId,
    endpoint: 'https://api.x.com/2/tweets',
    method: 'POST',
    body: tweetData,
    responseSchema: createTweetResponseSchema
  });
};
