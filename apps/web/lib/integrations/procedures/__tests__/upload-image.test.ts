import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadImage } from '../upload-image';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import { uploadMediaResponseSchema } from '@/lib/integrations/schemas/api';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient } from '@/test/prisma';

vi.mock('@/lib/integrations/utils/twitter-api-request', () => ({
  twitterApiRequest: vi.fn()
}));

const apiMock = vi.mocked(twitterApiRequest);
const fetchMock = vi.fn<typeof fetch>();

const tx = asPrismaClient();
const IMAGE_URL = 'https://cdn.giveaway.test/prize.png';
const BYTES = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);

const imageResponse = (type?: string) =>
  new Response(new Blob([BYTES], type ? { type } : {}), { status: 200 });

const uploaded = {
  data: { id: 'media-123', media_key: '3_media-123', size: 7 }
};

describe('uploadImage', () => {
  beforeEach(() => {
    apiMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the image cannot be downloaded', () => {
    it('throws BAD_REQUEST for a non-ok response', async () => {
      fetchMock.mockResolvedValue(new Response('missing', { status: 404 }));

      const error = await uploadImage(tx, 'team-1', IMAGE_URL, 'int-1').catch(
        (e: unknown) => e
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Failed to fetch image from URL'
      });
      expect(apiMock).not.toHaveBeenCalled();
    });

    it('propagates a network failure', async () => {
      const failure = new TypeError('fetch failed');
      fetchMock.mockRejectedValue(failure);

      await expect(uploadImage(tx, 'team-1', IMAGE_URL, 'int-1')).rejects.toBe(
        failure
      );
      expect(apiMock).not.toHaveBeenCalled();
    });
  });

  describe('when the image is downloaded', () => {
    beforeEach(() => {
      apiMock.mockResolvedValue(uploaded);
    });

    it('downloads the image url without extra options', async () => {
      fetchMock.mockResolvedValue(imageResponse('image/png'));

      await uploadImage(tx, 'team-1', IMAGE_URL, 'int-1');

      expect(fetchMock).toHaveBeenCalledWith(IMAGE_URL);
    });

    it('posts the base64 image to the X media upload endpoint', async () => {
      fetchMock.mockResolvedValue(imageResponse('image/png'));

      await uploadImage(tx, 'team-1', IMAGE_URL, 'int-1');

      expect(apiMock).toHaveBeenCalledWith({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/media/upload',
        method: 'POST',
        body: {
          media: Buffer.from(BYTES).toString('base64'),
          media_category: 'tweet_image',
          media_type: 'image/png'
        },
        responseSchema: uploadMediaResponseSchema
      });
    });

    it('defaults the media type to image/jpeg when the blob has no type', async () => {
      fetchMock.mockResolvedValue(imageResponse());

      await uploadImage(tx, 'team-1', IMAGE_URL, 'int-1');

      expect(apiMock.mock.calls[0][0].body).toMatchObject({
        media_type: 'image/jpeg'
      });
    });

    it('returns the uploaded media id', async () => {
      fetchMock.mockResolvedValue(imageResponse('image/gif'));

      await expect(uploadImage(tx, 'team-1', IMAGE_URL, 'int-1')).resolves.toBe(
        'media-123'
      );
    });

    it('propagates upload errors', async () => {
      fetchMock.mockResolvedValue(imageResponse('image/png'));
      const failure = new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Failed to fetch data from Twitter API'
      });
      apiMock.mockRejectedValue(failure);

      await expect(uploadImage(tx, 'team-1', IMAGE_URL, 'int-1')).rejects.toBe(
        failure
      );
    });
  });
});
