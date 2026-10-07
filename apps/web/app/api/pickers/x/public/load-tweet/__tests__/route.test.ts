import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  X_PICKER_LIKES_KEY,
  X_PICKER_QUOTES_KEY,
  X_PICKER_REPLIES_KEY,
  X_PICKER_RETWEETS_KEY
} from '@giveaway/x-picker-model/constants';
import {
  scrapeBadgerTweetResponse,
  scrapeBadgerUserResponse
} from '@giveaway/x-scraper/testing/fixtures-scrapebadger';

const m = vi.hoisted(() => ({
  creditsLimit: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  getById: vi.fn(),
  getByUsername: vi.fn()
}));

vi.mock('@giveaway/x-scraper/ratelimit', () => ({
  scrapeBadgerCredits: { limit: m.creditsLimit }
}));

vi.mock('@giveaway/cache/redis', () => ({
  redis: { get: m.redisGet, set: m.redisSet }
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: class {
    twitter = {
      tweets: { getById: m.getById },
      users: { getByUsername: m.getByUsername }
    };
  }
}));

const NOW = new Date('2026-06-01T00:00:00.000Z');
const POST_URL = 'https://x.com/author/status/123';

const TWEET = scrapeBadgerTweetResponse;

const USER = scrapeBadgerUserResponse;

const buildRequest = (
  body: unknown = { postUrl: POST_URL },
  headers: Record<string, string> = { 'x-forwarded-for': '198.51.100.1' }
) =>
  new NextRequest('http://localhost:3000/api/pickers/x/public/load-tweet', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

const genericError = {
  error: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  }
};

describe('POST /api/pickers/x/public/load-tweet', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const fn of Object.values(m)) {
      fn.mockReset();
    }
    m.creditsLimit.mockResolvedValue({
      success: true,
      remaining: 19,
      reset: NOW.getTime() + 60_000
    });
    m.redisGet.mockResolvedValue(null);
    m.redisSet.mockResolvedValue('OK');
    m.getById.mockResolvedValue(TWEET);
    m.getByUsername.mockResolvedValue(USER);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the request body fails validation', () => {
    it('returns 400 when the post url is missing', async () => {
      const res = await POST(buildRequest({}));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ success: false, error: 'Required' });
    });

    it('returns 400 when the post url is not a url', async () => {
      const res = await POST(buildRequest({ postUrl: 'not a url' }));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Please enter a valid URL'
      });
    });

    it('returns 400 when the url is not an X url', async () => {
      const res = await POST(
        buildRequest({ postUrl: 'https://example.com/status/1' })
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Please enter a valid X (Twitter) post URL'
      });
    });

    it('returns 400 when the body is not an object', async () => {
      const res = await POST(buildRequest('null'));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Expected object, received null'
      });
    });

    it('does not consume credits', async () => {
      await POST(buildRequest({ postUrl: 'not a url' }));

      expect(m.creditsLimit).not.toHaveBeenCalled();
    });
  });

  describe('when no tweet id can be extracted', () => {
    it('returns 400 for an X url that is not a status url', async () => {
      const res = await POST(buildRequest({ postUrl: 'https://x.com/author' }));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Could not extract tweet ID from URL'
      });
      expect(m.creditsLimit).not.toHaveBeenCalled();
    });

    it('returns 400 for a non-X url that merely contains x.com', async () => {
      const res = await POST(
        buildRequest({ postUrl: 'https://example.com/?ref=x.com' })
      );

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe(
        'Could not extract tweet ID from URL'
      );
    });
  });

  describe('when the body is not valid JSON', () => {
    it('returns a generic 500', async () => {
      const res = await POST(buildRequest('{'));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
    });
  });

  describe('tweet id extraction', () => {
    it.each([
      ['https://x.com/author/status/123', '123'],
      ['https://twitter.com/author/status/456?s=20', '456'],
      ['https://mobile.twitter.com/author/status/789', '789'],
      ['https://t.co/AbC123', 'AbC123']
    ])('fetches the tweet for %s', async (postUrl, tweetId) => {
      await POST(buildRequest({ postUrl }));

      expect(m.getById).toHaveBeenCalledWith(tweetId);
    });

    it('treats any domain ending in t.co as a short link', async () => {
      await POST(buildRequest({ postUrl: 'https://ghost.co/xyz' }));

      expect(m.getById).toHaveBeenCalledWith('xyz');
    });
  });

  describe('credit consumption', () => {
    it('charges one credit to the first forwarded ip', async () => {
      await POST(
        buildRequest(
          { postUrl: POST_URL },
          { 'x-forwarded-for': '203.0.113.5,10.0.0.1' }
        )
      );

      expect(m.creditsLimit).toHaveBeenCalledWith('ip:203.0.113.5', {
        rate: 1
      });
    });

    it('returns 429 with retry details when credits are exhausted', async () => {
      const reset = NOW.getTime() + 30_000;
      m.creditsLimit.mockResolvedValue({ success: false, remaining: 0, reset });

      const res = await POST(buildRequest());

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('30');
      expect(await res.json()).toEqual({
        success: false,
        error: 'Insufficient credits. Need 1, have 0. Resets in 30 seconds.',
        creditsNeeded: 1,
        creditsRemaining: 0,
        retryAfter: reset,
        retryAfterISO: new Date(reset).toISOString()
      });
      expect(m.getById).not.toHaveBeenCalled();
    });
  });

  describe('when the tweet loads', () => {
    it('returns the tweet details', async () => {
      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        data: {
          id: '1975236458112819456',
          text: 'Giveaway time! Retweet this post for a chance to win a year of dog treats #giveaway https://t.co/AbCdEf1234',
          username: 'TheGiveawayDog',
          profileImageUrl:
            'https://pbs.twimg.com/profile_images/1701234567890123456/AbCdEfGh_normal.jpg',
          favoriteCount: 48,
          retweetCount: 31,
          replyCount: 12,
          viewCount: 5408,
          quoteCount: 2,
          createdAt: '2026-10-06T16:00:00.000Z',
          isBlueVerified: true,
          userId: '1701234567890123456',
          media: [
            {
              url: 'https://pbs.twimg.com/media/G2AbCdEfGhIjKlM.jpg',
              width: 1200,
              height: 675,
              altText: 'A box of dog treats'
            }
          ],
          estimatedDurationMs: 3000
        }
      });
    });

    it('looks up the author by the tweet username', async () => {
      await POST(buildRequest());

      expect(m.getByUsername).toHaveBeenCalledWith('TheGiveawayDog');
    });

    it.each([
      [0, 3000],
      [100, 3000],
      [400, 6000],
      [5000, 10000]
    ])(
      'estimates the scrape duration for %i retweets as %i ms',
      async (retweetCount, estimatedDurationMs) => {
        m.getById.mockResolvedValue({ ...TWEET, retweet_count: retweetCount });

        const res = await POST(buildRequest());

        expect((await res.json()).data.estimatedDurationMs).toBe(
          estimatedDurationMs
        );
      }
    );

    it('records the engagement counts as site metrics in one transaction', async () => {
      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.siteMetric.upsert.mock.calls).toEqual([
        [
          {
            where: { key: X_PICKER_LIKES_KEY },
            create: { key: X_PICKER_LIKES_KEY, value: 48 },
            update: { value: { increment: 48 } }
          }
        ],
        [
          {
            where: { key: X_PICKER_RETWEETS_KEY },
            create: { key: X_PICKER_RETWEETS_KEY, value: 31 },
            update: { value: { increment: 31 } }
          }
        ],
        [
          {
            where: { key: X_PICKER_REPLIES_KEY },
            create: { key: X_PICKER_REPLIES_KEY, value: 12 },
            update: { value: { increment: 12 } }
          }
        ],
        [
          {
            where: { key: X_PICKER_QUOTES_KEY },
            create: { key: X_PICKER_QUOTES_KEY, value: 2 },
            update: { value: { increment: 2 } }
          }
        ]
      ]);
    });

    it('still succeeds when recording site metrics fails', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('metrics down'));

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect((await res.json()).success).toBe(true);
    });

    it('attaches a handler that swallows a failed metrics write', async () => {
      const metricsWrite = { catch: vi.fn() };
      prismaMock.$transaction.mockReturnValue(metricsWrite);

      await POST(buildRequest());

      expect(metricsWrite.catch).toHaveBeenCalledTimes(1);
      const [swallow] = metricsWrite.catch.mock.calls[0];
      expect(swallow(new Error('metrics down'))).toBeUndefined();
    });

    it('responds without waiting for the metrics write to settle', async () => {
      prismaMock.$transaction.mockReturnValue(new Promise(() => {}));

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect((await res.json()).data.id).toBe('1975236458112819456');
    });
  });

  describe('when the tweet has sparse data', () => {
    const sparseTweet = {
      id: '123',
      text: 'Hello',
      username: 'Author'
    };

    beforeEach(() => {
      m.getById.mockResolvedValue(sparseTweet);
      m.getByUsername.mockResolvedValue({
        id: 'author-id',
        username: 'Author'
      });
    });

    it('defaults counts, image, verification, user id and media', async () => {
      const res = await POST(buildRequest());

      const { data } = await res.json();
      expect(data).toEqual({
        id: '123',
        text: 'Hello',
        username: 'Author',
        profileImageUrl: null,
        favoriteCount: 0,
        retweetCount: 0,
        replyCount: 0,
        viewCount: null,
        quoteCount: 0,
        createdAt: NOW.toISOString(),
        isBlueVerified: false,
        userId: null,
        media: [],
        estimatedDurationMs: 3000
      });
    });

    it('records zero for missing engagement counts', async () => {
      await POST(buildRequest());

      expect(prismaMock.siteMetric.upsert).toHaveBeenCalledWith({
        where: { key: X_PICKER_RETWEETS_KEY },
        create: { key: X_PICKER_RETWEETS_KEY, value: 0 },
        update: { value: { increment: 0 } }
      });
    });
  });

  describe('when the tweet has no username', () => {
    it('returns the tweet without a username or the author details', async () => {
      m.getById.mockResolvedValue({ ...TWEET, username: null });

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect((await res.json()).data).toMatchObject({
        username: null,
        profileImageUrl: null,
        isBlueVerified: false
      });
      expect(m.getByUsername).not.toHaveBeenCalled();
    });
  });

  describe('when the author of the tweet cannot be loaded', () => {
    const error = new Error('user lookup failed');

    beforeEach(() => {
      m.getByUsername.mockRejectedValue(error);
    });

    it('returns the tweet without the author details', async () => {
      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect((await res.json()).data).toMatchObject({
        id: '1975236458112819456',
        username: 'TheGiveawayDog',
        profileImageUrl: null,
        isBlueVerified: false
      });
    });

    it('logs the error of the author lookup', async () => {
      await POST(buildRequest());

      expect(console.error).toHaveBeenCalledWith(
        '[load-tweet] Error loading the author of the tweet:',
        error
      );
    });

    it('still records the site metrics', async () => {
      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('when fields of the tweet fall back', () => {
    it('returns the tweet with the fallback values', async () => {
      m.getById.mockResolvedValue({
        ...TWEET,
        text: 7,
        retweet_count: '1,204',
        favorite_count: '48'
      });

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect((await res.json()).data).toMatchObject({
        text: '',
        retweetCount: 0,
        favoriteCount: 48
      });
    });

    it('leaves out a photo without a URL', async () => {
      m.getById.mockResolvedValue({
        ...TWEET,
        media: [
          { type: 'photo', url: 7 },
          { type: 'photo', url: 'https://pbs.twimg.com/media/b.jpg' }
        ]
      });

      const res = await POST(buildRequest());

      expect((await res.json()).data.media).toEqual([
        { url: 'https://pbs.twimg.com/media/b.jpg', altText: null }
      ]);
    });
  });

  describe('when ScrapeBadger returns a tweet that does not match the schema', () => {
    beforeEach(() => {
      m.getById.mockResolvedValue({ ...TWEET, id: 123 });
    });

    it('returns 502 and names the provider and the call', async () => {
      const res = await POST(buildRequest());

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({
        error: {
          code: 'BAD_GATEWAY',
          message: 'Unexpected response from X',
          data: { provider: 'scrapebadger', call: 'tweets.getById' }
        }
      });
    });

    it('does not cache the tweet or record site metrics', async () => {
      await POST(buildRequest());

      expect(m.redisSet).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when the tweet has an invalid creation date', () => {
    it('returns a generic 500', async () => {
      m.getById.mockResolvedValue({ ...TWEET, created_at: 'yesterday' });

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
    });
  });

  describe('when loading the tweet fails', () => {
    it('returns a generic 500 and logs the error', async () => {
      const error = new Error('scraper down');
      m.getById.mockRejectedValue(error);

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
      expect(console.error).toHaveBeenCalledWith(
        '[load-tweet] Error loading tweet:',
        error
      );
    });

    it('returns the configuration error when the scraper key is missing', async () => {
      vi.stubEnv('SCRAPEBADGER_API_KEY', '');

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'SCRAPEBADGER_API_KEY environment variable not set'
        }
      });
    });

    it('does not record site metrics', async () => {
      m.getById.mockRejectedValue(new Error('scraper down'));

      await POST(buildRequest());

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });
});
