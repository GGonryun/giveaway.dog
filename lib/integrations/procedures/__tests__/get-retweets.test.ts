import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRetweetedBy } from '../get-retweets';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import { retweetedByResponseSchema } from '@/lib/integrations/schemas/api';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient } from '@/test/prisma';

vi.mock('@/lib/integrations/utils/twitter-api-request', () => ({
  twitterApiRequest: vi.fn()
}));

const apiMock = vi.mocked(twitterApiRequest);

const USER_FIELDS =
  'created_at,description,id,location,name,profile_banner_url,profile_image_url,protected,public_metrics,url,username,verified,verified_type';

const tx = asPrismaClient();

const baseInput = {
  tweetId: '1234567890',
  maxResults: 100,
  teamId: 'team-1' as string | null,
  integrationId: 'int-1'
};

const lastRequest = () => apiMock.mock.calls[0][0];

describe('getRetweetedBy', () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ meta: { result_count: 0 } });
  });

  describe('when the team id is missing', () => {
    it('throws INTERNAL_SERVER_ERROR for a null team id', async () => {
      const error = await getRetweetedBy(tx, {
        ...baseInput,
        teamId: null
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing required parameter teamId'
      });
      expect(apiMock).not.toHaveBeenCalled();
    });

    it('throws INTERNAL_SERVER_ERROR for an empty team id', async () => {
      await expect(
        getRetweetedBy(tx, { ...baseInput, teamId: '' })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing required parameter teamId'
      });
      expect(apiMock).not.toHaveBeenCalled();
    });
  });

  describe('when the team id is present', () => {
    it('requests the retweeted_by endpoint for the tweet', async () => {
      await getRetweetedBy(tx, baseInput);

      expect(apiMock).toHaveBeenCalledTimes(1);
      expect(lastRequest()).toEqual({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/tweets/1234567890/retweeted_by',
        params: expect.any(URLSearchParams),
        responseSchema: retweetedByResponseSchema
      });
    });

    it('sends max_results and the user fields as query params', async () => {
      await getRetweetedBy(tx, { ...baseInput, maxResults: 50 });

      expect(lastRequest().params?.toString()).toBe(
        new URLSearchParams({
          max_results: '50',
          'user.fields': USER_FIELDS
        }).toString()
      );
    });

    it('omits the pagination token when none is given', async () => {
      await getRetweetedBy(tx, baseInput);

      expect(lastRequest().params?.has('pagination_token')).toBe(false);
    });

    it('appends the pagination token when provided', async () => {
      await getRetweetedBy(tx, { ...baseInput, paginationToken: 'page-2' });

      expect(lastRequest().params?.get('pagination_token')).toBe('page-2');
    });

    it('ignores an empty pagination token', async () => {
      await getRetweetedBy(tx, { ...baseInput, paginationToken: '' });

      expect(lastRequest().params?.has('pagination_token')).toBe(false);
    });

    it('extracts the tweet id from an x.com status url', async () => {
      await getRetweetedBy(tx, {
        ...baseInput,
        tweetId: 'https://www.x.com/acme_dog/status/42'
      });

      expect(lastRequest().endpoint).toBe(
        'https://api.x.com/2/tweets/42/retweeted_by'
      );
    });

    it('uses a status url with a query string verbatim in the endpoint', async () => {
      await getRetweetedBy(tx, {
        ...baseInput,
        tweetId: 'https://x.com/acme_dog/status/42?s=20'
      });

      expect(lastRequest().endpoint).toBe(
        'https://api.x.com/2/tweets/https://x.com/acme_dog/status/42?s=20/retweeted_by'
      );
    });

    it('passes an undefined integration id through', async () => {
      await getRetweetedBy(tx, { ...baseInput, integrationId: undefined });

      expect(lastRequest().integrationId).toBeUndefined();
    });

    it('returns the parsed twitter response unchanged', async () => {
      const response = {
        data: [{ id: 'u-1', name: 'Bob', username: 'bob' }],
        meta: { result_count: 1 }
      };
      apiMock.mockResolvedValue(response);

      await expect(getRetweetedBy(tx, baseInput)).resolves.toBe(response);
    });

    it('propagates twitter api errors', async () => {
      const failure = new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Failed to fetch data from Twitter API'
      });
      apiMock.mockRejectedValue(failure);

      await expect(getRetweetedBy(tx, baseInput)).rejects.toBe(failure);
    });
  });
});
