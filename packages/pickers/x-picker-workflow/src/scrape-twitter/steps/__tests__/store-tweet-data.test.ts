import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeBadgerTweet } from '@giveaway/x-scraper/testing/fixtures-scrapebadger';
import { storeTweetData } from '../store-tweet-data';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';

const mocks = vi.hoisted(() => {
  class FatalError extends Error {
    fatal = true;
    constructor(message: string) {
      super(message);
      this.name = 'FatalError';
    }
  }
  return { FatalError, getTweet: vi.fn() };
});

vi.mock('workflow', () => ({ FatalError: mocks.FatalError }));

vi.mock('@giveaway/x-scraper/procedures/get-tweet', () => ({
  getTweet: mocks.getTweet
}));

const tweet = scrapeBadgerTweet({
  id: '1111',
  text: 'Retweet to win!',
  created_at: '2025-01-01T00:00:00.000Z',
  user_id: 'author-1',
  username: 'doglover',
  favorite_count: 10,
  retweet_count: 100,
  reply_count: 5,
  view_count: 1000,
  quote_count: 2
});

describe('storeTweetData', () => {
  beforeEach(() => {
    mocks.getTweet.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the tweet loads and stores', () => {
    const stored = { id: 'post-1', tweetId: '1111', retweetCount: 100 };

    beforeEach(() => {
      mocks.getTweet.mockResolvedValue(tweet);
      prismaMock.twitterPost.create.mockResolvedValue(stored);
    });

    it('fetches the tweet by id', async () => {
      await storeTweetData({ tweetId: '1111', pickerId: 'picker-1' });

      expect(mocks.getTweet).toHaveBeenCalledWith({ tweetId: '1111' });
    });

    it('stores the tweet as a post of the picker', async () => {
      await storeTweetData({ tweetId: '1111', pickerId: 'picker-1' });

      expect(prismaMock.twitterPost.create).toHaveBeenCalledWith({
        data: {
          picker: { connect: { id: 'picker-1' } },
          tweetId: '1111',
          text: 'Retweet to win!',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          userId: 'author-1',
          username: 'doglover',
          favoriteCount: 10,
          retweetCount: 100,
          replyCount: 5,
          viewCount: 1000,
          quoteCount: 2
        }
      });
    });

    it('returns the stored post', async () => {
      await expect(
        storeTweetData({ tweetId: '1111', pickerId: 'picker-1' })
      ).resolves.toBe(stored);
    });
  });

  describe('when fetching the tweet fails', () => {
    it('throws a fatal error describing the tweet and cause', async () => {
      mocks.getTweet.mockRejectedValue(new Error('tweet deleted'));

      const promise = storeTweetData({ tweetId: '1111', pickerId: 'picker-1' });

      await expect(promise).rejects.toBeInstanceOf(mocks.FatalError);
      await expect(promise).rejects.toThrow(
        'Failed to store tweet data for tweetId 1111: Error: tweet deleted'
      );
    });

    it('logs the original error', async () => {
      const error = new Error('tweet deleted');
      mocks.getTweet.mockRejectedValue(error);

      await storeTweetData({ tweetId: '1111', pickerId: 'picker-1' }).catch(
        () => undefined
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error storing tweet data:',
        error
      );
    });

    it('does not write to the database', async () => {
      mocks.getTweet.mockRejectedValue(new Error('tweet deleted'));

      await storeTweetData({ tweetId: '1111', pickerId: 'picker-1' }).catch(
        () => undefined
      );

      expect(prismaMock.twitterPost.create).not.toHaveBeenCalled();
    });

    it('stringifies a non-error rejection into the message', async () => {
      mocks.getTweet.mockRejectedValue('timeout');

      await expect(
        storeTweetData({ tweetId: '1111', pickerId: 'picker-1' })
      ).rejects.toThrow('Failed to store tweet data for tweetId 1111: timeout');
    });
  });

  describe('when storing the post fails', () => {
    it('throws a fatal error describing the database failure', async () => {
      mocks.getTweet.mockResolvedValue(tweet);
      prismaMock.twitterPost.create.mockRejectedValue(
        knownRequestError('P2025', 'Picker missing')
      );

      await expect(
        storeTweetData({ tweetId: '1111', pickerId: 'missing' })
      ).rejects.toThrow(
        'Failed to store tweet data for tweetId 1111: PrismaClientKnownRequestError: Picker missing'
      );
    });
  });
});
