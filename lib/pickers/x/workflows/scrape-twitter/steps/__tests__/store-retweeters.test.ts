import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from 'scrapebadger';
import { storeRetweeters } from '../store-retweeters';
import { knownRequestError, prismaMock } from '@/test/prisma';

const mocks = vi.hoisted(() => {
  class FatalError extends Error {
    fatal = true;
    constructor(message: string) {
      super(message);
      this.name = 'FatalError';
    }
  }
  return {
    FatalError,
    getRetweeters: vi.fn(),
    getRetweetersUntil: vi.fn()
  };
});

vi.mock('workflow', () => ({ FatalError: mocks.FatalError }));

vi.mock('@/lib/scrapebadger/procedures/get-retweeters', () => ({
  getRetweeters: mocks.getRetweeters,
  getRetweetersUntil: mocks.getRetweetersUntil
}));

const scrapedUser = (id: string): User =>
  ({
    id,
    username: `user${id}`,
    name: `User ${id}`,
    description: 'bio',
    url: null,
    location: 'Dogtown',
    profile_image_url: 'https://img/p.png',
    profile_banner_url: null,
    created_at: '2020-01-01T00:00:00.000Z',
    can_dm: false,
    followers_count: 1,
    following_count: 2,
    tweet_count: 3,
    verified: true
  }) as unknown as User;

describe('storeRetweeters', () => {
  beforeEach(() => {
    mocks.getRetweeters.mockReset();
    mocks.getRetweetersUntil.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the retweeters load and store', () => {
    const page = {
      users: [scrapedUser('1'), scrapedUser('2')],
      nextCursor: 'cursor-2',
      hasMore: true
    };

    beforeEach(() => {
      mocks.getRetweetersUntil.mockResolvedValue(page);
      prismaMock.twitterPickerUser.createMany.mockResolvedValue({ count: 2 });
    });

    it('fetches up to 5 pages starting from the cursor', async () => {
      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: 'cursor-1'
      });

      expect(mocks.getRetweetersUntil).toHaveBeenCalledWith({
        tweetId: '1111',
        cursor: 'cursor-1',
        maxApiCalls: 5
      });
    });

    it('starts from the beginning without a cursor', async () => {
      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      expect(mocks.getRetweetersUntil).toHaveBeenCalledWith({
        tweetId: '1111',
        cursor: undefined,
        maxApiCalls: 5
      });
    });

    it('stores the users for the picker and skips duplicates', async () => {
      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ pickerId: 'picker-1', userId: '1' }),
          expect.objectContaining({ pickerId: 'picker-1', userId: '2' })
        ],
        skipDuplicates: true
      });
    });

    it('maps the scraped profile fields to picker user columns', async () => {
      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      const { data } = prismaMock.twitterPickerUser.createMany.mock.calls[0][0];
      expect(data[0]).toEqual({
        pickerId: 'picker-1',
        userId: '1',
        username: 'user1',
        name: 'User 1',
        description: 'bio',
        url: null,
        location: 'Dogtown',
        profileImageUrl: 'https://img/p.png',
        bannerImageUrl: null,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        canDm: false,
        followersCount: 1,
        followingCount: 2,
        tweetCount: 3,
        verified: true
      });
    });

    it('returns the fetched page with its cursor', async () => {
      const result = await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      expect(result).toBe(page);
    });

    it('does not use the single page fetcher', async () => {
      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      expect(mocks.getRetweeters).not.toHaveBeenCalled();
    });
  });

  describe('when there are no retweeters', () => {
    it('stores an empty batch', async () => {
      mocks.getRetweetersUntil.mockResolvedValue({
        users: [],
        hasMore: false
      });
      prismaMock.twitterPickerUser.createMany.mockResolvedValue({ count: 0 });

      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true
      });
    });
  });

  describe('when fetching fails', () => {
    it('throws a fatal error describing the tweet and cause', async () => {
      mocks.getRetweetersUntil.mockRejectedValue(new Error('rate limited'));

      const promise = storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      });

      await expect(promise).rejects.toBeInstanceOf(mocks.FatalError);
      await expect(promise).rejects.toThrow(
        'Failed to store retweeters for tweetId 1111: Error: rate limited'
      );
    });

    it('logs the original error', async () => {
      const error = new Error('rate limited');
      mocks.getRetweetersUntil.mockRejectedValue(error);

      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      }).catch(() => undefined);

      expect(console.error).toHaveBeenCalledWith(
        'Error storing retweeters:',
        error
      );
    });

    it('does not write to the database', async () => {
      mocks.getRetweetersUntil.mockRejectedValue(new Error('rate limited'));

      await storeRetweeters({
        tweetId: '1111',
        pickerId: 'picker-1',
        cursor: undefined
      }).catch(() => undefined);

      expect(prismaMock.twitterPickerUser.createMany).not.toHaveBeenCalled();
    });
  });

  describe('when storing fails', () => {
    it('throws a fatal error describing the database failure', async () => {
      mocks.getRetweetersUntil.mockResolvedValue({
        users: [scrapedUser('1')],
        hasMore: false
      });
      prismaMock.twitterPickerUser.createMany.mockRejectedValue(
        knownRequestError('P2003', 'Foreign key constraint failed')
      );

      await expect(
        storeRetweeters({
          tweetId: '1111',
          pickerId: 'missing',
          cursor: undefined
        })
      ).rejects.toThrow(
        'Failed to store retweeters for tweetId 1111: PrismaClientKnownRequestError: Foreign key constraint failed'
      );
    });
  });
});
