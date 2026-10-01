import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLikingUsers } from '../get-liking-users';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import { likingUsersResponseSchema } from '@/lib/integrations/schemas/api';
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

describe('getLikingUsers', () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ data: [], meta: { result_count: 0 } });
  });

  describe('when the team id is missing', () => {
    it('throws INTERNAL_SERVER_ERROR for a null team id', async () => {
      const error = await getLikingUsers(tx, {
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
        getLikingUsers(tx, { ...baseInput, teamId: '' })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing required parameter teamId'
      });
      expect(apiMock).not.toHaveBeenCalled();
    });
  });

  describe('when the team id is present', () => {
    it('requests the liking users endpoint for the tweet', async () => {
      await getLikingUsers(tx, baseInput);

      expect(apiMock).toHaveBeenCalledTimes(1);
      expect(lastRequest()).toEqual({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/tweets/1234567890/liking_users',
        params: expect.any(URLSearchParams),
        responseSchema: likingUsersResponseSchema
      });
    });

    it('sends max_results and the user fields as query params', async () => {
      await getLikingUsers(tx, { ...baseInput, maxResults: 25 });

      expect(lastRequest().params?.toString()).toBe(
        new URLSearchParams({
          max_results: '25',
          'user.fields': USER_FIELDS
        }).toString()
      );
    });

    it('serialises a zero max results value', async () => {
      await getLikingUsers(tx, { ...baseInput, maxResults: 0 });

      expect(lastRequest().params?.get('max_results')).toBe('0');
    });

    it('omits the pagination token when none is given', async () => {
      await getLikingUsers(tx, baseInput);

      expect(lastRequest().params?.has('pagination_token')).toBe(false);
    });

    it('appends the pagination token when provided', async () => {
      await getLikingUsers(tx, { ...baseInput, paginationToken: 'next-abc' });

      expect(lastRequest().params?.get('pagination_token')).toBe('next-abc');
    });

    it('ignores an empty pagination token', async () => {
      await getLikingUsers(tx, { ...baseInput, paginationToken: '' });

      expect(lastRequest().params?.has('pagination_token')).toBe(false);
    });

    it('extracts the tweet id from an x.com status url', async () => {
      await getLikingUsers(tx, {
        ...baseInput,
        tweetId: 'https://x.com/acme_dog/status/987654321'
      });

      expect(lastRequest().endpoint).toBe(
        'https://api.x.com/2/tweets/987654321/liking_users'
      );
    });

    it('uses a twitter.com status url verbatim in the endpoint', async () => {
      await getLikingUsers(tx, {
        ...baseInput,
        tweetId: 'https://twitter.com/acme_dog/status/987654321'
      });

      expect(lastRequest().endpoint).toBe(
        'https://api.x.com/2/tweets/https://twitter.com/acme_dog/status/987654321/liking_users'
      );
    });

    it('passes an undefined integration id through', async () => {
      await getLikingUsers(tx, { ...baseInput, integrationId: undefined });

      expect(lastRequest().integrationId).toBeUndefined();
    });

    it('returns the parsed twitter response unchanged', async () => {
      const response = {
        data: [{ id: 'u-1', name: 'Alice', username: 'alice' }],
        meta: { result_count: 1, next_token: 'next-1' }
      };
      apiMock.mockResolvedValue(response);

      await expect(getLikingUsers(tx, baseInput)).resolves.toBe(response);
    });

    it('propagates twitter api errors', async () => {
      const failure = new ApplicationError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Twitter API rate limit exceeded'
      });
      apiMock.mockRejectedValue(failure);

      await expect(getLikingUsers(tx, baseInput)).rejects.toBe(failure);
    });
  });
});
