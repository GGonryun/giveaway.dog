import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRepliesTo } from '../get-replies';
import { twitterApiRequest } from '@/lib/integrations/utils/twitter-api-request';
import {
  repliedByResponseSchema,
  type Tweet
} from '@/lib/integrations/schemas/api';
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
  tweetId: '100',
  maxResults: 50,
  teamId: 'team-1',
  integrationId: 'int-1'
};

const reply = (id: string, repliedTo?: string): Tweet => ({
  id,
  text: `reply ${id}`,
  author_id: `author-${id}`,
  conversation_id: 'conv-1',
  referenced_tweets: repliedTo ? [{ type: 'replied_to', id: repliedTo }] : []
});

const conversation = (conversationId?: string) => ({
  data: conversationId ? [{ id: '100', conversation_id: conversationId }] : []
});

const requestAt = (index: number) => apiMock.mock.calls[index][0];

describe('getRepliesTo', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  describe('when looking up the conversation', () => {
    it('requests the tweet with its conversation id field', async () => {
      apiMock.mockResolvedValueOnce(conversation());

      await getRepliesTo(tx, baseInput);

      expect(requestAt(0)).toEqual({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/tweets',
        params: expect.any(URLSearchParams),
        responseSchema: expect.anything()
      });
      expect(requestAt(0).params?.toString()).toBe(
        'ids=100&tweet.fields=conversation_id'
      );
    });

    it('uses the tweet id extracted from an x.com status url', async () => {
      apiMock.mockResolvedValueOnce(conversation());

      await getRepliesTo(tx, {
        ...baseInput,
        tweetId: 'https://x.com/acme_dog/status/100'
      });

      expect(requestAt(0).params?.get('ids')).toBe('100');
    });

    it('validates the lookup with a schema requiring ids and conversation ids', async () => {
      apiMock.mockResolvedValueOnce(conversation());

      await getRepliesTo(tx, baseInput);

      const schema = requestAt(0).responseSchema;
      expect(
        schema.safeParse({ data: [{ id: '1', conversation_id: 'c' }] }).success
      ).toBe(true);
      expect(schema.safeParse({ data: [{ id: '1' }] }).success).toBe(false);
      expect(schema.safeParse({}).success).toBe(false);
    });

    it('returns an empty result without searching when no conversation is found', async () => {
      apiMock.mockResolvedValueOnce(conversation());

      const result = await getRepliesTo(tx, baseInput);

      expect(result).toEqual({ data: [], meta: { result_count: 0 } });
      expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('returns an empty result when the conversation id is an empty string', async () => {
      apiMock.mockResolvedValueOnce({
        data: [{ id: '100', conversation_id: '' }]
      });

      const result = await getRepliesTo(tx, baseInput);

      expect(result).toEqual({ data: [], meta: { result_count: 0 } });
      expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('uses the conversation id of the first returned tweet', async () => {
      apiMock
        .mockResolvedValueOnce({
          data: [
            { id: '100', conversation_id: 'conv-first' },
            { id: '101', conversation_id: 'conv-second' }
          ]
        })
        .mockResolvedValueOnce({ data: [] });

      await getRepliesTo(tx, baseInput);

      expect(requestAt(1).params?.get('query')).toBe(
        'conversation_id:conv-first'
      );
    });

    it('propagates errors from the conversation lookup', async () => {
      const failure = new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Invalid response format from Twitter'
      });
      apiMock.mockRejectedValueOnce(failure);

      await expect(getRepliesTo(tx, baseInput)).rejects.toBe(failure);
    });
  });

  describe('when searching the conversation', () => {
    it('searches recent tweets in the conversation', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [], meta: { result_count: 0 } });

      await getRepliesTo(tx, baseInput);

      expect(requestAt(1)).toEqual({
        tx,
        teamId: 'team-1',
        integrationId: 'int-1',
        endpoint: 'https://api.x.com/2/tweets/search/recent',
        params: expect.any(URLSearchParams),
        responseSchema: repliedByResponseSchema
      });
    });

    it('sends the conversation query, max results, expansions and fields', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [] });

      await getRepliesTo(tx, baseInput);

      expect(requestAt(1).params?.toString()).toBe(
        new URLSearchParams({
          query: 'conversation_id:conv-1',
          max_results: '50',
          expansions: 'author_id',
          'tweet.fields':
            'created_at,author_id,public_metrics,referenced_tweets,conversation_id,in_reply_to_user_id',
          'user.fields': USER_FIELDS
        }).toString()
      );
    });

    it('omits next_token when no pagination token is given', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [] });

      await getRepliesTo(tx, baseInput);

      expect(requestAt(1).params?.has('next_token')).toBe(false);
    });

    it('forwards the pagination token as next_token', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [] });

      await getRepliesTo(tx, { ...baseInput, paginationToken: 'tok-2' });

      expect(requestAt(1).params?.get('next_token')).toBe('tok-2');
      expect(requestAt(1).params?.has('pagination_token')).toBe(false);
    });

    it('ignores an empty pagination token', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [] });

      await getRepliesTo(tx, { ...baseInput, paginationToken: '' });

      expect(requestAt(1).params?.has('next_token')).toBe(false);
    });

    it('keeps only direct replies to the requested tweet', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({
          data: [
            reply('201', '100'),
            reply('202', '201'),
            reply('203'),
            { ...reply('204'), referenced_tweets: undefined },
            {
              ...reply('205'),
              referenced_tweets: [{ type: 'quoted', id: '100' }]
            },
            reply('206', '100')
          ],
          meta: { result_count: 6 }
        });

      const result = await getRepliesTo(tx, baseInput);

      expect(result.data?.map((t) => t.id)).toEqual(['201', '206']);
    });

    it('ignores retweet references to the requested tweet', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({
          data: [
            {
              ...reply('207'),
              referenced_tweets: [{ type: 'retweeted', id: '100' }]
            }
          ]
        });

      const result = await getRepliesTo(tx, baseInput);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ result_count: 0 });
    });

    it('uses the first replied_to reference when a tweet has several', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({
          data: [
            {
              ...reply('301'),
              referenced_tweets: [
                { type: 'replied_to', id: '999' },
                { type: 'replied_to', id: '100' }
              ]
            }
          ]
        });

      const result = await getRepliesTo(tx, baseInput);

      expect(result.data).toEqual([]);
    });

    it('matches replies against the id extracted from a status url', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [reply('201', '100')] });

      const result = await getRepliesTo(tx, {
        ...baseInput,
        tweetId: 'https://x.com/acme_dog/status/100'
      });

      expect(result.data?.map((t) => t.id)).toEqual(['201']);
    });

    it('recounts the result and keeps the remaining response fields', async () => {
      const includes = {
        users: [{ id: 'author-201', name: 'Dan', username: 'dan' }]
      };
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({
          data: [reply('201', '100'), reply('202', '201')],
          includes,
          meta: { result_count: 2, next_token: 'more' }
        });

      const result = await getRepliesTo(tx, baseInput);

      expect(result).toEqual({
        data: [reply('201', '100')],
        includes,
        meta: { result_count: 1, next_token: 'more' }
      });
    });

    it('returns undefined data and a zero count when the search has no data', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ meta: { result_count: 7 } });

      const result = await getRepliesTo(tx, baseInput);

      expect(result).toEqual({ data: undefined, meta: { result_count: 0 } });
    });

    it('adds a meta block when the search response has none', async () => {
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockResolvedValueOnce({ data: [reply('201', '100')] });

      const result = await getRepliesTo(tx, baseInput);

      expect(result.meta).toEqual({ result_count: 1 });
    });

    it('propagates errors from the search request', async () => {
      const failure = new ApplicationError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Twitter API rate limit exceeded'
      });
      apiMock
        .mockResolvedValueOnce(conversation('conv-1'))
        .mockRejectedValueOnce(failure);

      await expect(getRepliesTo(tx, baseInput)).rejects.toBe(failure);
    });
  });
});
