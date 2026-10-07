import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  ScrapeBadgerTweet,
  ScrapeBadgerUser
} from '@giveaway/x-scraper/schemas';
import {
  scrapeBadgerRetweeter,
  scrapeBadgerTweet
} from '@giveaway/x-scraper/testing/fixtures-scrapebadger';
import { fetchRetweetersWithCoverage } from '../fetch-retweeters-with-coverage';

const mocks = vi.hoisted(() => ({
  getTweetCached: vi.fn(),
  getRetweetersUntilCached: vi.fn()
}));

vi.mock('@giveaway/x-scraper/procedures/get-tweet-cached', () => ({
  getTweetCached: mocks.getTweetCached
}));

vi.mock('@giveaway/x-scraper/procedures/get-retweeters-cached', () => ({
  getRetweetersUntilCached: mocks.getRetweetersUntilCached
}));

const buildTweet = (retweetCount: unknown): ScrapeBadgerTweet =>
  ({
    ...scrapeBadgerTweet({ id: '1111', text: 'Retweet to win!' }),
    retweet_count: retweetCount
  }) as ScrapeBadgerTweet;

const buildUser = (id: string): ScrapeBadgerUser =>
  scrapeBadgerRetweeter({ id, username: `user${id}`, name: `User ${id}` });

describe('fetchRetweetersWithCoverage', () => {
  beforeEach(() => {
    mocks.getTweetCached.mockReset();
    mocks.getRetweetersUntilCached.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the tweet and retweeters load', () => {
    it('returns the fetched users together with the tweet', async () => {
      const tweet = buildTweet(400);
      const users = [buildUser('1'), buildUser('2')];
      mocks.getTweetCached.mockResolvedValue(tweet);
      mocks.getRetweetersUntilCached.mockResolvedValue({
        users,
        nextCursor: 'next',
        hasMore: true
      });

      const result = await fetchRetweetersWithCoverage('1111');

      expect(result).toEqual({ users, tweet });
    });

    it('looks the tweet up by id', async () => {
      mocks.getTweetCached.mockResolvedValue(buildTweet(0));
      mocks.getRetweetersUntilCached.mockResolvedValue({
        users: [],
        hasMore: false
      });

      await fetchRetweetersWithCoverage('1111');

      expect(mocks.getTweetCached).toHaveBeenCalledWith({ tweetId: '1111' });
    });

    it('sizes the retweeter request from the retweet count', async () => {
      mocks.getTweetCached.mockResolvedValue(buildTweet(400));
      mocks.getRetweetersUntilCached.mockResolvedValue({
        users: [],
        hasMore: false
      });

      await fetchRetweetersWithCoverage('1111');

      expect(mocks.getRetweetersUntilCached).toHaveBeenCalledWith({
        tweetId: '1111',
        maxApiCalls: 6
      });
    });

    it('converts a string retweet count to a number', async () => {
      mocks.getTweetCached.mockResolvedValue(buildTweet('5000'));
      mocks.getRetweetersUntilCached.mockResolvedValue({
        users: [],
        hasMore: false
      });

      await fetchRetweetersWithCoverage('1111');

      expect(mocks.getRetweetersUntilCached).toHaveBeenCalledWith({
        tweetId: '1111',
        maxApiCalls: 10
      });
    });

    it.each([undefined, null, 'lots', Number.NaN])(
      'treats a retweet count of %j as zero',
      async (retweetCount) => {
        mocks.getTweetCached.mockResolvedValue(buildTweet(retweetCount));
        mocks.getRetweetersUntilCached.mockResolvedValue({
          users: [],
          hasMore: false
        });

        await fetchRetweetersWithCoverage('1111');

        expect(mocks.getRetweetersUntilCached).toHaveBeenCalledWith({
          tweetId: '1111',
          maxApiCalls: 3
        });
      }
    );

    it('logs the retweet count, call budget and elapsed time', async () => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(350.456);
      mocks.getTweetCached.mockResolvedValue(buildTweet(400));
      mocks.getRetweetersUntilCached.mockResolvedValue({
        users: [buildUser('1')],
        hasMore: false
      });

      await fetchRetweetersWithCoverage('1111');

      expect(console.info).toHaveBeenCalledWith(
        '[fetchRetweetersWithCoverage] Tweet 1111 has 400 retweets, using 6 API calls'
      );
      expect(console.info).toHaveBeenCalledWith(
        '[fetchRetweetersWithCoverage] Fetched 1 retweeters for tweet 1111 in 250.46ms'
      );
    });
  });

  describe('when loading fails', () => {
    it('rejects without fetching retweeters when the tweet lookup fails', async () => {
      mocks.getTweetCached.mockRejectedValue(new Error('tweet not found'));

      await expect(fetchRetweetersWithCoverage('1111')).rejects.toThrow(
        'tweet not found'
      );
      expect(mocks.getRetweetersUntilCached).not.toHaveBeenCalled();
    });

    it('rejects when the retweeter lookup fails', async () => {
      mocks.getTweetCached.mockResolvedValue(buildTweet(10));
      mocks.getRetweetersUntilCached.mockRejectedValue(
        new Error('rate limited')
      );

      await expect(fetchRetweetersWithCoverage('1111')).rejects.toThrow(
        'rate limited'
      );
    });
  });
});
