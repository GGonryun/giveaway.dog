import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Tweet, User } from 'scrapebadger';
import { scrapeTwitterWorkflow } from '../workflow';
import { prismaMock } from '@giveaway/testing-server/prisma';

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
    sleep: vi.fn(),
    getTweet: vi.fn(),
    getRetweeters: vi.fn(),
    getRetweetersUntil: vi.fn()
  };
});

vi.mock('workflow', () => ({
  FatalError: mocks.FatalError,
  sleep: mocks.sleep
}));

vi.mock('@/lib/scrapebadger/procedures/get-tweet', () => ({
  getTweet: mocks.getTweet
}));

vi.mock('@/lib/scrapebadger/procedures/get-retweeters', () => ({
  getRetweeters: mocks.getRetweeters,
  getRetweetersUntil: mocks.getRetweetersUntil
}));

type Page = { users: User[]; nextCursor?: string; hasMore: boolean };

const scrapedUsers = (count: number, prefix: string): User[] =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        id: `${prefix}-${i}`,
        username: `${prefix}${i}`,
        name: `${prefix} ${i}`,
        created_at: '2020-01-01T00:00:00.000Z',
        followers_count: 1,
        following_count: 1,
        tweet_count: 1,
        verified: false
      }) as unknown as User
  );

const setupTweets = (
  tweets: Record<string, { retweetCount: number | null; pages: Page[] }>
) => {
  mocks.getTweet.mockImplementation(
    async ({ tweetId }: { tweetId: string }) =>
      ({
        id: tweetId,
        text: `tweet ${tweetId}`,
        created_at: '2025-01-01T00:00:00.000Z',
        retweet_count: tweets[tweetId].retweetCount
      }) as unknown as Tweet
  );
  prismaMock.twitterPost.create.mockImplementation(
    async ({ data }: { data: { tweetId: string } }) => ({
      id: `post-${data.tweetId}`,
      tweetId: data.tweetId,
      retweetCount: tweets[data.tweetId].retweetCount
    })
  );
  const queues = Object.fromEntries(
    Object.entries(tweets).map(([id, { pages }]) => [id, [...pages]])
  );
  mocks.getRetweetersUntil.mockImplementation(
    async ({ tweetId }: { tweetId: string }) => {
      const next = queues[tweetId].shift();
      if (!next) {
        throw new Error(`No more pages for ${tweetId}`);
      }
      return next;
    }
  );
};

const statusUpdates = () =>
  prismaMock.twitterPicker.update.mock.calls.map(([args]) => args.data.status);

const retweeterCalls = () =>
  mocks.getRetweetersUntil.mock.calls.map(([args]) => args);

const progressLogs = () =>
  vi
    .mocked(console.info)
    .mock.calls.map(([message]) => String(message))
    .filter((message) => message.startsWith('Progress:'));

describe('scrapeTwitterWorkflow', () => {
  beforeEach(() => {
    mocks.sleep.mockReset();
    mocks.getTweet.mockReset();
    mocks.getRetweeters.mockReset();
    mocks.getRetweetersUntil.mockReset();
    mocks.sleep.mockResolvedValue(undefined);
    prismaMock.twitterPicker.update.mockResolvedValue({});
    prismaMock.twitterPickerUser.createMany.mockResolvedValue({ count: 0 });
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when started immediately', () => {
    beforeEach(() => {
      setupTweets({
        '1': {
          retweetCount: 3,
          pages: [{ users: scrapedUsers(3, 'a'), hasMore: false }]
        }
      });
    });

    it('marks the picker processing and then complete', async () => {
      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'COMPLETE']);
      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
        where: { id: 'picker-1' },
        data: { status: 'PROCESSING' }
      });
    });

    it('does not sleep', async () => {
      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(mocks.sleep).not.toHaveBeenCalled();
    });

    it('resolves without a value', async () => {
      await expect(
        scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' })
      ).resolves.toBeUndefined();
    });
  });

  describe('when scheduled for later', () => {
    const runDate = new Date('2025-07-01T09:00:00.000Z');

    beforeEach(() => {
      setupTweets({
        '1': {
          retweetCount: 1,
          pages: [{ users: scrapedUsers(1, 'a'), hasMore: false }]
        }
      });
    });

    it('marks the picker scheduled and then complete', async () => {
      await scrapeTwitterWorkflow({
        tweetIds: ['1'],
        pickerId: 'picker-1',
        runDate
      });

      expect(statusUpdates()).toEqual(['SCHEDULED', 'COMPLETE']);
    });

    it('sleeps until the run date before fetching tweets', async () => {
      await scrapeTwitterWorkflow({
        tweetIds: ['1'],
        pickerId: 'picker-1',
        runDate
      });

      expect(mocks.sleep).toHaveBeenCalledWith(runDate);
      const [scheduledOrder] =
        prismaMock.twitterPicker.update.mock.invocationCallOrder;
      const [sleepOrder] = mocks.sleep.mock.invocationCallOrder;
      const [tweetOrder] = mocks.getTweet.mock.invocationCallOrder;
      expect(scheduledOrder).toBeLessThan(sleepOrder);
      expect(sleepOrder).toBeLessThan(tweetOrder);
    });

    it('marks the picker failed when sleeping fails', async () => {
      mocks.sleep.mockRejectedValue(new Error('cancelled'));

      await scrapeTwitterWorkflow({
        tweetIds: ['1'],
        pickerId: 'picker-1',
        runDate
      });

      expect(statusUpdates()).toEqual(['SCHEDULED', 'FAILED']);
      expect(mocks.getTweet).not.toHaveBeenCalled();
    });
  });

  describe('scraping tweets', () => {
    it('stores every tweet before scraping any retweeters', async () => {
      setupTweets({
        '1': { retweetCount: 1, pages: [{ users: [], hasMore: false }] },
        '2': { retweetCount: 1, pages: [{ users: [], hasMore: false }] }
      });

      await scrapeTwitterWorkflow({
        tweetIds: ['1', '2'],
        pickerId: 'picker-1'
      });

      expect(mocks.getTweet.mock.calls).toEqual([
        [{ tweetId: '1' }],
        [{ tweetId: '2' }]
      ]);
      expect(prismaMock.twitterPost.create).toHaveBeenCalledTimes(2);
      const lastTweetOrder = Math.max(
        ...mocks.getTweet.mock.invocationCallOrder
      );
      const [firstRetweeterOrder] =
        mocks.getRetweetersUntil.mock.invocationCallOrder;
      expect(lastTweetOrder).toBeLessThan(firstRetweeterOrder);
    });

    it('stores each tweet as a post of the picker', async () => {
      setupTweets({
        '1': { retweetCount: 1, pages: [{ users: [], hasMore: false }] },
        '2': { retweetCount: 1, pages: [{ users: [], hasMore: false }] }
      });

      await scrapeTwitterWorkflow({
        tweetIds: ['1', '2'],
        pickerId: 'picker-1'
      });

      expect(
        prismaMock.twitterPost.create.mock.calls.map(([args]) => ({
          picker: args.data.picker,
          tweetId: args.data.tweetId
        }))
      ).toEqual([
        { picker: { connect: { id: 'picker-1' } }, tweetId: '1' },
        { picker: { connect: { id: 'picker-1' } }, tweetId: '2' }
      ]);
    });

    it('follows retweeter cursors until there are no more pages', async () => {
      setupTweets({
        '1': {
          retweetCount: 50,
          pages: [
            { users: scrapedUsers(2, 'a'), nextCursor: 'c1', hasMore: true },
            { users: scrapedUsers(2, 'b'), nextCursor: 'c2', hasMore: true },
            { users: scrapedUsers(1, 'c'), hasMore: false }
          ]
        }
      });

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(retweeterCalls()).toEqual([
        { tweetId: '1', cursor: undefined, maxApiCalls: 5 },
        { tweetId: '1', cursor: 'c1', maxApiCalls: 5 },
        { tweetId: '1', cursor: 'c2', maxApiCalls: 5 }
      ]);
      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledTimes(3);
    });

    it('scrapes tweets one after another, each from the first page', async () => {
      setupTweets({
        '1': {
          retweetCount: 2,
          pages: [
            { users: scrapedUsers(1, 'a'), nextCursor: 'c1', hasMore: true },
            { users: scrapedUsers(1, 'b'), hasMore: false }
          ]
        },
        '2': {
          retweetCount: 1,
          pages: [{ users: scrapedUsers(1, 'c'), hasMore: false }]
        }
      });

      await scrapeTwitterWorkflow({
        tweetIds: ['1', '2'],
        pickerId: 'picker-1'
      });

      expect(retweeterCalls()).toEqual([
        { tweetId: '1', cursor: undefined, maxApiCalls: 5 },
        { tweetId: '1', cursor: 'c1', maxApiCalls: 5 },
        { tweetId: '2', cursor: undefined, maxApiCalls: 5 }
      ]);
    });

    it('stores each page of retweeters for the picker', async () => {
      setupTweets({
        '1': {
          retweetCount: 2,
          pages: [{ users: scrapedUsers(2, 'a'), hasMore: false }]
        }
      });

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ pickerId: 'picker-1', userId: 'a-0' }),
          expect.objectContaining({ pickerId: 'picker-1', userId: 'a-1' })
        ],
        skipDuplicates: true
      });
    });

    it('restarts from the first page when more pages are reported without a cursor', async () => {
      setupTweets({
        '1': {
          retweetCount: 2,
          pages: [
            { users: scrapedUsers(1, 'a'), hasMore: true },
            { users: scrapedUsers(1, 'a'), hasMore: false }
          ]
        }
      });

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(retweeterCalls()).toEqual([
        { tweetId: '1', cursor: undefined, maxApiCalls: 5 },
        { tweetId: '1', cursor: undefined, maxApiCalls: 5 }
      ]);
    });

    it('completes without scraping when there are no tweets', async () => {
      await scrapeTwitterWorkflow({ tweetIds: [], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'COMPLETE']);
      expect(mocks.getTweet).not.toHaveBeenCalled();
      expect(mocks.getRetweetersUntil).not.toHaveBeenCalled();
    });
  });

  describe('progress logging', () => {
    it('reports progress against the total retweet count', async () => {
      setupTweets({
        '1': {
          retweetCount: 10,
          pages: [
            { users: scrapedUsers(2, 'a'), nextCursor: 'c1', hasMore: true },
            { users: scrapedUsers(3, 'b'), hasMore: false }
          ]
        }
      });

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(progressLogs()).toEqual(['Progress: 2/10', 'Progress: 5/10']);
    });

    it('treats a null retweet count as zero in the total', async () => {
      setupTweets({
        '1': {
          retweetCount: null,
          pages: [{ users: scrapedUsers(2, 'a'), hasMore: false }]
        },
        '2': {
          retweetCount: 4,
          pages: [{ users: scrapedUsers(1, 'b'), hasMore: false }]
        }
      });

      await scrapeTwitterWorkflow({
        tweetIds: ['1', '2'],
        pickerId: 'picker-1'
      });

      expect(progressLogs()).toEqual(['Progress: 2/4', 'Progress: 3/4']);
    });

    it('double counts earlier tweets when starting the third tweet', async () => {
      setupTweets({
        '1': {
          retweetCount: 2,
          pages: [{ users: scrapedUsers(2, 'a'), hasMore: false }]
        },
        '2': {
          retweetCount: 3,
          pages: [{ users: scrapedUsers(3, 'b'), hasMore: false }]
        },
        '3': {
          retweetCount: 1,
          pages: [{ users: scrapedUsers(1, 'c'), hasMore: false }]
        }
      });

      await scrapeTwitterWorkflow({
        tweetIds: ['1', '2', '3'],
        pickerId: 'picker-1'
      });

      expect(progressLogs()).toEqual([
        'Progress: 2/6',
        'Progress: 5/6',
        'Progress: 8/6'
      ]);
    });

    it('logs the page size and resulting cursor', async () => {
      setupTweets({
        '1': {
          retweetCount: 2,
          pages: [
            { users: scrapedUsers(2, 'a'), nextCursor: 'c1', hasMore: false }
          ]
        }
      });

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(console.info).toHaveBeenCalledWith(
        'Scraped 2 retweeters for tweet 1'
      );
      expect(console.info).toHaveBeenCalledWith(
        'Resulting cursor: c1, hasMore: false'
      );
    });
  });

  describe('when a step fails', () => {
    it('marks the picker failed when a tweet cannot be stored', async () => {
      mocks.getTweet.mockRejectedValue(new Error('tweet deleted'));

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'FAILED']);
      expect(mocks.getRetweetersUntil).not.toHaveBeenCalled();
    });

    it('marks the picker failed when retweeters cannot be stored', async () => {
      setupTweets({
        '1': {
          retweetCount: 5,
          pages: [
            { users: scrapedUsers(1, 'a'), nextCursor: 'c1', hasMore: true }
          ]
        }
      });
      mocks.getRetweetersUntil
        .mockResolvedValueOnce({
          users: scrapedUsers(1, 'a'),
          nextCursor: 'c1',
          hasMore: true
        })
        .mockRejectedValueOnce(new Error('rate limited'));

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'FAILED']);
      expect(retweeterCalls()).toHaveLength(2);
      expect(prismaMock.twitterPickerUser.createMany).toHaveBeenCalledTimes(1);
    });

    it('resolves instead of rethrowing the step error', async () => {
      mocks.getTweet.mockRejectedValue(new Error('tweet deleted'));

      await expect(
        scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' })
      ).resolves.toBeUndefined();
    });

    it('marks the picker failed when the initial status update fails', async () => {
      prismaMock.twitterPicker.update
        .mockRejectedValueOnce(new Error('db down'))
        .mockResolvedValue({});

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'FAILED']);
      expect(mocks.getTweet).not.toHaveBeenCalled();
    });

    it('marks the picker failed when the completion update fails', async () => {
      setupTweets({
        '1': { retweetCount: 0, pages: [{ users: [], hasMore: false }] }
      });
      prismaMock.twitterPicker.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('db down'))
        .mockResolvedValue({});

      await scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' });

      expect(statusUpdates()).toEqual(['PROCESSING', 'COMPLETE', 'FAILED']);
    });

    it('rejects when the failure status cannot be saved either', async () => {
      prismaMock.twitterPicker.update.mockRejectedValue(new Error('db down'));

      await expect(
        scrapeTwitterWorkflow({ tweetIds: ['1'], pickerId: 'picker-1' })
      ).rejects.toThrow('db down');
    });
  });
});
