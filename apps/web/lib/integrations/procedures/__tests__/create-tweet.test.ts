import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTweet } from '../create-tweet';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import {
  createTweetResponseSchema,
  uploadMediaResponseSchema
} from '@giveaway/integration-model/api';
import { ApplicationError } from '@giveaway/util-errors';
import { asPrismaClient } from '@giveaway/testing-server/prisma';

vi.mock('@/lib/integrations/utils/twitter-api-request', () => ({
  twitterApiRequest: vi.fn()
}));

const apiMock = vi.mocked(twitterApiRequest);
const fetchMock = vi.fn<typeof fetch>();

const tx = asPrismaClient();

const baseInput = {
  teamId: 'team-1',
  integrationId: 'int-1',
  text: 'Giveaway is live!'
};

const created = {
  data: {
    id: 'tweet-1',
    text: 'Giveaway is live!',
    edit_history_tweet_ids: ['tweet-1']
  }
};

describe('createTweet', () => {
  beforeEach(() => {
    apiMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the team id is missing', () => {
    it('throws INTERNAL_SERVER_ERROR without calling X', async () => {
      const error = await createTweet(tx, {
        ...baseInput,
        teamId: '',
        imageUrl: 'https://cdn.giveaway.test/a.png'
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing required parameter teamId'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(apiMock).not.toHaveBeenCalled();
    });
  });

  describe('when posting text only', () => {
    beforeEach(() => {
      apiMock.mockResolvedValue(created);
    });

    it('posts the text to the X tweets endpoint', async () => {
      await createTweet(tx, baseInput);

      expect(apiMock).toHaveBeenCalledTimes(1);
      expect(apiMock).toHaveBeenCalledWith({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/tweets',
        method: 'POST',
        body: { text: 'Giveaway is live!' },
        responseSchema: createTweetResponseSchema
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the created tweet response', async () => {
      await expect(createTweet(tx, baseInput)).resolves.toBe(created);
    });

    it('drops media ids passed directly in the input', async () => {
      await createTweet(tx, {
        ...baseInput,
        media: { media_ids: ['existing-media'] }
      });

      expect(apiMock.mock.calls[0][0].body).toEqual({
        text: 'Giveaway is live!'
      });
    });

    it('forwards the text verbatim including surrounding whitespace', async () => {
      await createTweet(tx, { ...baseInput, text: '  spaced out \n' });

      expect(apiMock.mock.calls[0][0].body).toEqual({
        text: '  spaced out \n'
      });
    });

    it('forwards text longer than 280 characters without validation', async () => {
      const text = 'x'.repeat(300);

      await createTweet(tx, { ...baseInput, text });

      expect(apiMock.mock.calls[0][0].body).toEqual({ text });
    });

    it('treats an empty image url as no image', async () => {
      await createTweet(tx, { ...baseInput, imageUrl: '' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(apiMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when posting with an image', () => {
    const imageInput = {
      ...baseInput,
      imageUrl: 'https://cdn.giveaway.test/prize.png'
    };

    beforeEach(() => {
      fetchMock.mockResolvedValue(
        new Response(
          new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
        )
      );
      apiMock
        .mockResolvedValueOnce({ data: { id: 'media-9', media_key: 'k' } })
        .mockResolvedValueOnce(created);
    });

    it('uploads the image before creating the tweet', async () => {
      await createTweet(tx, imageInput);

      expect(fetchMock).toHaveBeenCalledWith(imageInput.imageUrl);
      expect(apiMock).toHaveBeenCalledTimes(2);
      expect(apiMock.mock.calls[0][0]).toMatchObject({
        endpoint: 'https://api.x.com/2/media/upload',
        teamId: 'team-1',
        integrationId: 'int-1',
        responseSchema: uploadMediaResponseSchema
      });
    });

    it('uploads the image within the same transaction', async () => {
      await createTweet(tx, imageInput);

      expect(apiMock.mock.calls[0][0].tx).toBe(tx);
      expect(apiMock.mock.calls[1][0].tx).toBe(tx);
    });

    it('attaches the uploaded media id to the tweet body', async () => {
      await createTweet(tx, imageInput);

      expect(apiMock.mock.calls[1][0]).toMatchObject({
        endpoint: 'https://api.x.com/2/tweets',
        method: 'POST',
        body: {
          text: 'Giveaway is live!',
          media: { media_ids: ['media-9'] }
        }
      });
    });

    it('returns the created tweet response', async () => {
      await expect(createTweet(tx, imageInput)).resolves.toBe(created);
    });

    it('does not create the tweet when the image download fails', async () => {
      fetchMock.mockReset();
      fetchMock.mockResolvedValue(new Response('nope', { status: 404 }));

      await expect(createTweet(tx, imageInput)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Failed to fetch image from URL'
      });
      expect(apiMock).not.toHaveBeenCalled();
    });
  });
});
