'use server';

import { Tx } from '@/lib/prisma';
import { ApplicationError } from '@/lib/errors';
import { getLatestTeamBlueskyCredentials } from '@/lib/bluesky/get-latest-team-bluesky-agent';
import { RichText } from '@atproto/api';

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
