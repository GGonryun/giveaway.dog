'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { twitterApiRequest } from './twitter-api-request';
import {
  CreateTweetRequest,
  CreateTweetResponse,
  createTweetResponseSchema
} from '@giveaway/integration-model/api';
import { ApplicationError } from '@giveaway/util-errors';
import { uploadImage } from './upload-image';

interface CreateTweetInput extends CreateTweetRequest {
  teamId: string;
  integrationId: string;
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
    const mediaId = await uploadImage(
      tx,
      input.teamId,
      input.imageUrl,
      input.integrationId
    );
    tweetData.media = {
      media_ids: [mediaId]
    };
  }

  return twitterApiRequest({
    tx,
    teamId: input.teamId,
    integrationId: input.integrationId,
    endpoint: 'https://api.x.com/2/tweets',
    method: 'POST',
    body: tweetData,
    responseSchema: createTweetResponseSchema
  });
};
