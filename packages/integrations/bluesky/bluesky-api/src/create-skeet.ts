'use server';

import { Tx } from '@giveaway/db-client/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { getLatestTeamBlueskyCredentials } from './bluesky/get-latest-team-bluesky-agent';
import { RichText } from '@atproto/api';
import { isE2eFakeOn } from '@giveaway/e2e-fakes/switch';
import { recordE2eOutbox } from '@giveaway/e2e-fakes/outbox';

interface CreateSkeetInput {
  teamId: string;
  text: string;
  imageUrl?: string;
}

interface CreateSkeetResponse {
  uri: string;
  cid: string;
}

export const createSkeet = async (
  tx: Tx,
  input: CreateSkeetInput
): Promise<CreateSkeetResponse> => {
  if (!input.teamId) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing required parameter teamId'
    });
  }

  if (isE2eFakeOn('bluesky')) {
    const entry = await recordE2eOutbox({
      channel: 'bluesky',
      target: input.teamId,
      payload: { text: input.text, imageUrl: input.imageUrl ?? null }
    });
    return {
      uri: `at://${entry.id}/app.bsky.feed.post/${entry.id}`,
      cid: entry.id
    };
  }

  const { agent } = await getLatestTeamBlueskyCredentials(tx, input.teamId);

  const rt = new RichText({ text: input.text });
  await rt.detectFacets(agent);

  const postRecord: any = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString()
  };

  if (input.imageUrl) {
    const imageResponse = await fetch(input.imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageUint8 = new Uint8Array(imageBuffer);

    const uploadResponse = await agent.uploadBlob(imageUint8);

    postRecord.embed = {
      $type: 'app.bsky.embed.images',
      images: [
        {
          image: uploadResponse.data.blob,
          alt: ''
        }
      ]
    };
  }

  const response = await agent.post(postRecord);

  return {
    uri: response.uri,
    cid: response.cid
  };
};
