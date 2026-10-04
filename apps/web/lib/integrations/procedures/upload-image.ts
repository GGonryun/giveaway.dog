import { ApplicationError } from '@giveaway/util-errors';
import { Tx } from '@giveaway/db-client/prisma';
import { twitterApiRequest } from '../utils/twitter-api-request';
import { uploadMediaResponseSchema } from '@giveaway/integration-model/api';

export async function uploadImage(
  tx: Tx,
  teamId: string,
  imageUrl: string,
  integrationId: string
): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Failed to fetch image from URL'
    });
  }

  const imageBlob = await imageResponse.blob();
  const mimeType = imageBlob.type || 'image/jpeg';

  const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
  const base64Image = imageBuffer.toString('base64');

  const uploadResult = await twitterApiRequest({
    tx,
    teamId,
    integrationId,
    endpoint: 'https://api.x.com/2/media/upload',
    method: 'POST',
    body: {
      media: base64Image,
      media_category: 'tweet_image',
      media_type: mimeType
    },
    responseSchema: uploadMediaResponseSchema
  });

  return uploadResult.data.id;
}
