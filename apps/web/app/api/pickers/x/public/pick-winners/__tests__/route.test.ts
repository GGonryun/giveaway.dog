import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prismaMock } from '@giveaway/testing-server/prisma';

const m = vi.hoisted(() => ({
  creditsLimit: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  getById: vi.fn(),
  getRetweeters: vi.fn(),
  createId: vi.fn()
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
      tweets: { getById: m.getById, getRetweeters: m.getRetweeters }
    };
  }
}));

vi.mock('@paralleldrive/cuid2', () => ({ createId: m.createId }));

const NOW = new Date('2026-06-01T00:00:00.000Z');
const POST_URL = 'https://x.com/author/status/123';

type RetweeterFixture = {
  id: string;
  username?: string;
  name?: string;
  description?: string;
  url?: string;
  location?: string;
  profile_image_url?: string;
  profile_banner_url?: string;
  created_at?: string;
  can_dm?: boolean;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
};

const retweeter = (
  id: string,
  overrides: Partial<RetweeterFixture> = {}
): RetweeterFixture => ({
  id,
  username: `user${id}`,
  name: `User ${id}`,
  description: `Bio ${id}`,
  url: `https://example.com/${id}`,
  location: 'Earth',
  profile_image_url: `https://img.example.com/${id}.png`,
  profile_banner_url: `https://banner.example.com/${id}.png`,
  created_at: '2020-01-01T00:00:00.000Z',
  can_dm: true,
  followers_count: 100,
  following_count: 50,
  tweet_count: 1000,
  verified: false,
  ...overrides
});

const TWEET = {
  id: '123',
  text: 'Retweet to win!',
  created_at: '2026-05-01T00:00:00.000Z',
  user_id: 'author-id',
  username: 'author',
  favorite_count: 10,
  retweet_count: 3,
  reply_count: 2,
  quote_count: 1,
  view_count: 500,
  media: []
};

const noFilters = {
  minimumPostCount: null,
  minimumAccountAgeDays: null,
  minimumFollowers: null,
  minimumFollowing: null,
  lastPostWithin: null,
  hasProfileImage: false,
  hasBanner: false,
  hasLocation: false,
  hasDescription: false
};

const buildBody = (overrides: Record<string, unknown> = {}) => ({
  postUrl: POST_URL,
  winnersCount: 2,
  filters: noFilters,
  ...overrides
});

const buildRequest = (
  body: unknown = buildBody(),
  headers: Record<string, string> = { 'x-forwarded-for': '198.51.100.1' }
) =>
  new NextRequest('http://localhost:3000/api/pickers/x/public/pick-winners', {
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

describe('POST /api/pickers/x/public/pick-winners', () => {
  let idCounter: number;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    idCounter = 0;
    for (const fn of Object.values(m)) {
      fn.mockReset();
    }
    m.createId.mockImplementation(() => `id-${++idCounter}`);
    m.creditsLimit.mockResolvedValue({
      success: true,
      remaining: 19,
      reset: NOW.getTime() + 60_000
    });
    m.redisGet.mockResolvedValue(null);
    m.redisSet.mockResolvedValue('OK');
    m.getById.mockResolvedValue(TWEET);
    m.getRetweeters.mockResolvedValue({
      data: [retweeter('1'), retweeter('2'), retweeter('3')],
      hasMore: false
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the post url is not an X status url', () => {
    it('returns 400 with an error message', async () => {
      const res = await POST(
        buildRequest(buildBody({ postUrl: 'https://example.com/post/1' }))
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Invalid X post URL'
      });
    });

    it('does not consume credits', async () => {
      await POST(
        buildRequest(buildBody({ postUrl: 'https://example.com/post/1' }))
      );

      expect(m.creditsLimit).not.toHaveBeenCalled();
    });

    it('returns a generic 500 when the post url is missing', async () => {
      const res = await POST(buildRequest(buildBody({ postUrl: undefined })));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
    });
  });

  describe('when the body is not valid JSON', () => {
    it('returns a generic 500', async () => {
      const res = await POST(buildRequest('{'));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
    });
  });

  describe('credit consumption', () => {
    it('charges one credit to the first forwarded ip', async () => {
      await POST(
        buildRequest(buildBody(), {
          'x-forwarded-for': ' 203.0.113.5 , 10.0.0.1'
        })
      );

      expect(m.creditsLimit).toHaveBeenCalledWith('ip:203.0.113.5', {
        rate: 1
      });
    });

    it('falls back to the real ip header', async () => {
      await POST(buildRequest(buildBody(), { 'x-real-ip': '192.0.2.9' }));

      expect(m.creditsLimit).toHaveBeenCalledWith('ip:192.0.2.9', { rate: 1 });
    });

    it('charges an unknown ip when no ip header is present', async () => {
      await POST(buildRequest(buildBody(), {}));

      expect(m.creditsLimit).toHaveBeenCalledWith('ip:unknown', { rate: 1 });
    });

    it('returns 429 with retry details when credits are exhausted', async () => {
      const reset = NOW.getTime() + 90_500;
      m.creditsLimit.mockResolvedValue({ success: false, remaining: 0, reset });

      const res = await POST(buildRequest());

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('91');
      expect(await res.json()).toEqual({
        success: false,
        error: 'Insufficient credits. Need 1, have 0. Resets in 91 seconds.',
        creditsNeeded: 1,
        creditsRemaining: 0,
        retryAfter: reset,
        retryAfterISO: new Date(reset).toISOString()
      });
    });

    it('does not fetch the post when credits are exhausted', async () => {
      m.creditsLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: NOW.getTime()
      });

      await POST(buildRequest());

      expect(m.getById).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('fetching the post', () => {
    it('fetches the tweet id parsed from an x.com url', async () => {
      await POST(buildRequest());

      expect(m.getById).toHaveBeenCalledWith('123');
    });

    it('fetches the tweet id parsed from a twitter.com url', async () => {
      await POST(
        buildRequest(
          buildBody({ postUrl: 'https://twitter.com/someone/status/987' })
        )
      );

      expect(m.getById).toHaveBeenCalledWith('987');
    });

    it('uses the short code of a t.co link as the tweet id', async () => {
      await POST(buildRequest(buildBody({ postUrl: 'https://t.co/AbC123' })));

      expect(m.getById).toHaveBeenCalledWith('AbC123');
    });

    it.each([
      ['https://notx.com/someone/status/555', '555'],
      ['https://ghost.co/xyz', 'xyz']
    ])(
      'accepts %s without checking the domain and charges a credit',
      async (postUrl, tweetId) => {
        await POST(buildRequest(buildBody({ postUrl })));

        expect(m.creditsLimit).toHaveBeenCalledTimes(1);
        expect(m.getById).toHaveBeenCalledWith(tweetId);
      }
    );

    it('returns a generic 500 when the post has no retweeters', async () => {
      m.getRetweeters.mockResolvedValue({ data: [], hasMore: false });

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('returns a generic 500 when the scraper is not configured', async () => {
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
  });

  describe('when there are enough eligible retweeters', () => {
    it('returns the draw, post id, winners and post author', async () => {
      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        data: {
          drawId: 'id-1',
          postId: '123',
          winners: [
            {
              id: '1',
              username: 'user1',
              name: 'User 1',
              profileImageUrl: 'https://img.example.com/1.png',
              profileUrl: 'https://x.com/user1'
            },
            {
              id: '2',
              username: 'user2',
              name: 'User 2',
              profileImageUrl: 'https://img.example.com/2.png',
              profileUrl: 'https://x.com/user2'
            }
          ],
          postAuthor: {
            username: 'author',
            name: 'Giveaway Dog',
            profileUrl: 'https://x.com/author'
          }
        }
      });
    });

    it('creates a completed picker that stores the request filters', async () => {
      await POST(
        buildRequest(
          buildBody({
            winnersCount: 1,
            filters: {
              minimumPostCount: 1,
              minimumAccountAgeDays: 2,
              minimumFollowers: 3,
              minimumFollowing: 4,
              lastPostWithin: 'PAST_DAY',
              hasProfileImage: true,
              hasBanner: true,
              hasLocation: true,
              hasDescription: true
            }
          })
        )
      );

      expect(prismaMock.twitterPicker.create).toHaveBeenCalledWith({
        data: {
          id: 'id-1',
          tweetUrls: [POST_URL],
          winners: 1,
          minPostCount: 1,
          minAccountAgeDays: 2,
          minFollowersCount: 3,
          minFollowingCount: 4,
          requireProfileImage: true,
          requireBannerImage: true,
          requireLocation: true,
          requireBio: true,
          lastPostWithin: 'PAST_DAY',
          status: 'COMPLETE'
        }
      });
    });

    it('stores the post linked to the picker', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPost.create).toHaveBeenCalledWith({
        data: {
          picker: { connect: { id: 'id-1' } },
          tweetId: '123',
          text: 'Retweet to win!',
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
          userId: 'author-id',
          username: 'author',
          favoriteCount: 10,
          retweetCount: 3,
          replyCount: 2,
          viewCount: 500,
          quoteCount: 1
        }
      });
    });

    it('stores every retweeter with a generated id and skips duplicates', async () => {
      await POST(buildRequest());

      const call = prismaMock.twitterPickerUser.createMany.mock.calls[0][0];
      expect(call.skipDuplicates).toBe(true);
      expect(call.data.map((user: { id: string }) => user.id)).toEqual([
        'id-2',
        'id-3',
        'id-4'
      ]);
      expect(call.data[0]).toEqual({
        id: 'id-2',
        pickerId: 'id-1',
        userId: '1',
        username: 'user1',
        name: 'User 1',
        description: 'Bio 1',
        url: 'https://example.com/1',
        location: 'Earth',
        profileImageUrl: 'https://img.example.com/1.png',
        bannerImageUrl: 'https://banner.example.com/1.png',
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        canDm: true,
        followersCount: 100,
        followingCount: 50,
        tweetCount: 1000,
        verified: false
      });
    });

    it('stores one draw per winner that references the stored retweeter row', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPickerDraw.createMany).toHaveBeenCalledWith({
        data: [
          { id: 'id-5', pickerId: 'id-1', userId: 'id-2' },
          { id: 'id-6', pickerId: 'id-1', userId: 'id-3' }
        ]
      });
    });

    it('writes the picker, post, retweeters and draws in a single transaction', async () => {
      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(4);
    });

    it('passes the picker, post, retweeter and draw writes to the transaction in that order', async () => {
      prismaMock.twitterPicker.create.mockReturnValue('picker-write');
      prismaMock.twitterPost.create.mockReturnValue('post-write');
      prismaMock.twitterPickerUser.createMany.mockReturnValue('users-write');
      prismaMock.twitterPickerDraw.createMany.mockReturnValue('draws-write');

      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        'picker-write',
        'post-write',
        'users-write',
        'draws-write'
      ]);
    });

    it('issues each write exactly once', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPicker.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPost.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPickerDraw.createMany).toHaveBeenCalledTimes(1);
    });

    it('reports the id parsed from the url as the post id even when the fetched tweet id differs', async () => {
      const res = await POST(
        buildRequest(buildBody({ postUrl: 'https://t.co/AbC123' }))
      );

      const { data } = await res.json();
      expect(data.postId).toBe('AbC123');
      expect(prismaMock.twitterPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tweetId: '123' })
      });
    });

    it('picks winners using the shuffled order', async () => {
      vi.mocked(Math.random).mockReturnValue(0);

      const res = await POST(buildRequest());

      const { data } = await res.json();
      expect(data.winners.map((winner: { id: string }) => winner.id)).toEqual([
        '2',
        '3'
      ]);
    });

    it('allows requesting every eligible retweeter as a winner', async () => {
      const res = await POST(buildRequest(buildBody({ winnersCount: 3 })));

      const { data } = await res.json();
      expect(data.winners).toHaveLength(3);
    });

    it('accepts a request for zero winners and stores an empty draw', async () => {
      const res = await POST(buildRequest(buildBody({ winnersCount: 0 })));

      expect(res.status).toBe(200);
      expect((await res.json()).data.winners).toEqual([]);
      expect(prismaMock.twitterPicker.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ winners: 0 })
      });
      expect(prismaMock.twitterPickerDraw.createMany).toHaveBeenCalledWith({
        data: []
      });
    });
  });

  describe('winner and author fallbacks', () => {
    it('fills in placeholders for winners without a username, name or image', async () => {
      m.getRetweeters.mockResolvedValue({
        data: [
          retweeter('1', {
            username: undefined,
            name: undefined,
            profile_image_url: undefined
          })
        ],
        hasMore: false
      });

      const res = await POST(buildRequest(buildBody({ winnersCount: 1 })));

      const { data } = await res.json();
      expect(data.winners).toEqual([
        {
          id: '1',
          username: 'unknown',
          name: 'Unknown User',
          profileImageUrl: 'https://avatar.vercel.sh/undefined',
          profileUrl: 'https://x.com/undefined'
        }
      ]);
    });

    it('uses a generated avatar when only the profile image is missing', async () => {
      m.getRetweeters.mockResolvedValue({
        data: [retweeter('1', { profile_image_url: undefined })],
        hasMore: false
      });

      const res = await POST(buildRequest(buildBody({ winnersCount: 1 })));

      const { data } = await res.json();
      expect(data.winners[0].profileImageUrl).toBe(
        'https://avatar.vercel.sh/user1'
      );
    });

    it('falls back to the Giveaway Dog account when the post has no username', async () => {
      m.getById.mockResolvedValue({ ...TWEET, username: undefined });

      const res = await POST(buildRequest());

      const { data } = await res.json();
      expect(data.postAuthor).toEqual({
        username: 'TheGiveawayDog',
        name: 'Giveaway Dog',
        profileUrl: 'https://x.com/TheGiveawayDog'
      });
    });
  });

  describe('when filters leave too few eligible retweeters', () => {
    beforeEach(() => {
      m.getRetweeters.mockResolvedValue({
        data: [
          retweeter('1', { followers_count: 5 }),
          retweeter('2', { followers_count: 500 }),
          retweeter('3', { followers_count: 1 })
        ],
        hasMore: false
      });
    });

    it('returns 400 explaining how many retweeters passed', async () => {
      const res = await POST(
        buildRequest(
          buildBody({
            winnersCount: 2,
            filters: { ...noFilters, minimumFollowers: 100 }
          })
        )
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: {
          code: 'BAD_REQUEST',
          message:
            'Not enough eligible entries. Only 1 of 3 users passed your filters, but you requested 2 winners. Try relaxing your filter requirements.'
        }
      });
    });

    it('does not write anything', async () => {
      await POST(
        buildRequest(
          buildBody({
            winnersCount: 2,
            filters: { ...noFilters, minimumFollowers: 100 }
          })
        )
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('only picks retweeters that pass the filters', async () => {
      const res = await POST(
        buildRequest(
          buildBody({
            winnersCount: 1,
            filters: { ...noFilters, minimumFollowers: 100 }
          })
        )
      );

      const { data } = await res.json();
      expect(data.winners.map((winner: { id: string }) => winner.id)).toEqual([
        '2'
      ]);
    });
  });

  describe('when the filters object is missing', () => {
    it('returns a generic 500 after charging credits', async () => {
      const res = await POST(buildRequest(buildBody({ filters: undefined })));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
      expect(m.creditsLimit).toHaveBeenCalledTimes(1);
    });
  });

  describe('when saving the draw fails', () => {
    it('returns a generic 500', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('write failed'));

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(genericError);
    });

    it('logs the error', async () => {
      const error = new Error('write failed');
      prismaMock.$transaction.mockRejectedValue(error);

      await POST(buildRequest());

      expect(console.error).toHaveBeenCalledWith(
        '[pick-winners] Error picking winners:',
        error
      );
    });
  });
});
