import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FatalError, RetryableError } from 'workflow';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  FAULTS,
  type FakeNetwork,
  fakeNetwork,
  isTransientFault,
  knownBug,
  retryAfterTime,
  settleWithin
} from '@giveaway/testing-server/faults';
import { storeTweetData } from '../store-tweet-data';
import { storeRetweeters } from '../store-retweeters';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const TWEET = 'GET https://scrapebadger.com/v1/twitter/tweets/tweet/123';
const RETWEETERS = `${TWEET}/retweeters`;

const ISSUE = '#309';

const STEPS = [
  {
    step: 'storeTweetData',
    match: TWEET,
    run: () => storeTweetData({ tweetId: '123', pickerId: 'picker-1' }),
    stored: () => prismaMock.twitterPost.create
  },
  {
    step: 'storeRetweeters',
    match: RETWEETERS,
    run: () =>
      storeRetweeters({
        tweetId: '123',
        pickerId: 'picker-1',
        cursor: undefined
      }),
    stored: () => prismaMock.twitterPickerUser.createMany
  }
];

const failure = (run: () => Promise<unknown>) =>
  settleWithin(
    run().then(
      () => undefined,
      (error: unknown) => error
    )
  );

let network: FakeNetwork;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv('SCRAPEBADGER_API_KEY', 'scrapebadger-key');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.twitterPost.create.mockResolvedValue({ id: 'post-1' });
  prismaMock.twitterPickerUser.createMany.mockResolvedValue({ count: 0 });
  network = fakeNetwork();
  network.json(TWEET, {
    id: '123',
    text: 'Retweet to win',
    created_at: '2026-09-01T00:00:00.000Z',
    retweet_count: 0
  });
  network.json(RETWEETERS, { data: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe.each(STEPS)(
  'when the ScrapeBadger request of $step fails',
  ({ match, run, stored }) => {
    it('stores the result when nothing fails', async () => {
      expect(await failure(run)).toBeUndefined();

      expect(network.requests(match)).not.toHaveLength(0);
      expect(stored()).toHaveBeenCalledTimes(1);
    });

    describe.each(FAULTS)('with %s', (fault) => {
      if (!isTransientFault(fault)) {
        it('fails the scrape for good and stores nothing', async () => {
          network.fault(match, fault);

          const error = await failure(run);

          expect(FatalError.is(error)).toBe(true);
          expect(stored()).not.toHaveBeenCalled();
        });
        return;
      }

      it(
        ...knownBug(
          'throws an error that the workflow retries, and stores nothing',
          ISSUE
        ),
        async () => {
          const retryAt = retryAfterTime();
          network.fault(match, fault);

          const error = await failure(run);

          expect(error).toBeInstanceOf(Error);
          expect(FatalError.is(error)).toBe(false);
          expect(stored()).not.toHaveBeenCalled();
          if (fault === 'rate-limit-retry-after') {
            expect(RetryableError.is(error)).toBe(true);
            expect(
              (error as RetryableError).retryAfter.getTime()
            ).toBeGreaterThanOrEqual(retryAt.getTime());
          }
        }
      );
    });
  }
);
