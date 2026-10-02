import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuoteTweets } from '../get-quote-tweets';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import { quoteTweetsResponseSchema } from '@/lib/integrations/schemas/api';
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
  maxResults: 10,
  teamId: 'team-1',
  integrationId: 'int-1'
};

const lastRequest = () => apiMock.mock.calls[0][0];

describe('getQuoteTweets', () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({ meta: { result_count: 0 } });
  });

  it('requests the quote_tweets endpoint for the tweet', async () => {
    await getQuoteTweets(tx, baseInput);

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(lastRequest()).toEqual({
      tx,
      teamId: 'team-1',
      integrationId: 'int-1',
      endpoint: 'https://api.x.com/2/tweets/1234567890/quote_tweets',
      params: expect.any(URLSearchParams),
      responseSchema: quoteTweetsResponseSchema
    });
  });

  it('sends the expansion and field query params', async () => {
    await getQuoteTweets(tx, baseInput);

    expect(lastRequest().params?.toString()).toBe(
      new URLSearchParams({
        max_results: '100',
        expansions: 'author_id',
        'tweet.fields': 'created_at,author_id,public_metrics',
        'user.fields': USER_FIELDS
      }).toString()
    );
  });

  it('always asks for 100 results regardless of maxResults', async () => {
    await getQuoteTweets(tx, { ...baseInput, maxResults: 5 });

    expect(lastRequest().params?.get('max_results')).toBe('100');
  });

  it('does not validate the team id before calling the api', async () => {
    await getQuoteTweets(tx, { ...baseInput, teamId: '' });

    expect(lastRequest().teamId).toBe('');
  });

  it('omits the pagination token when none is given', async () => {
    await getQuoteTweets(tx, baseInput);

    expect(lastRequest().params?.has('pagination_token')).toBe(false);
  });

  it('appends the pagination token when provided', async () => {
    await getQuoteTweets(tx, { ...baseInput, paginationToken: 'qt-next' });

    expect(lastRequest().params?.get('pagination_token')).toBe('qt-next');
  });

  it('ignores an empty pagination token', async () => {
    await getQuoteTweets(tx, { ...baseInput, paginationToken: '' });

    expect(lastRequest().params?.has('pagination_token')).toBe(false);
  });

  it('extracts the tweet id from an x.com status url', async () => {
    await getQuoteTweets(tx, {
      ...baseInput,
      tweetId: 'http://x.com/acme_dog/status/555'
    });

    expect(lastRequest().endpoint).toBe(
      'https://api.x.com/2/tweets/555/quote_tweets'
    );
  });

  it('passes an undefined integration id through', async () => {
    await getQuoteTweets(tx, { ...baseInput, integrationId: undefined });

    expect(lastRequest().integrationId).toBeUndefined();
  });

  it('returns the parsed twitter response unchanged', async () => {
    const response = {
      data: [{ id: 't-1', text: 'quoted!', author_id: 'u-1' }],
      includes: { users: [{ id: 'u-1', name: 'Carol', username: 'carol' }] },
      meta: { result_count: 1 }
    };
    apiMock.mockResolvedValue(response);

    await expect(getQuoteTweets(tx, baseInput)).resolves.toBe(response);
  });

  it('propagates twitter api errors', async () => {
    const failure = new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Twitter integration not found'
    });
    apiMock.mockRejectedValue(failure);

    await expect(getQuoteTweets(tx, baseInput)).rejects.toBe(failure);
  });
});
