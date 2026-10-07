import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import { createHost } from '@giveaway/testing-integration/fixtures';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { scrapeTwitterWorkflow } from '../workflow';
import { storeTweetData } from '../steps/store-tweet-data';
import { storeRetweeters } from '../steps/store-retweeters';

const TWEET_ID = '1234567890';
const TWEET = `https://scrapebadger.com/v1/twitter/tweets/tweet/${TWEET_ID}`;

const xUser = (id: string) => ({
  id,
  username: `user_${id}`,
  name: `User ${id}`,
  created_at: '2020-01-01T00:00:00.000Z',
  followers_count: 10,
  following_count: 10,
  tweet_count: 10,
  verified: false
});

const createPicker = async () => {
  const { team } = await createHost();
  return db.twitterPicker.create({
    data: {
      teamId: team.id,
      winners: 1,
      tweetUrls: [`https://x.com/giveawaydog/status/${TWEET_ID}`]
    }
  });
};

const storedTweets = (pickerId: string) =>
  db.twitterPost.findMany({ where: { pickerId }, select: { tweetId: true } });

const storedRetweeters = async (pickerId: string) =>
  (
    await db.twitterPickerUser.findMany({
      where: { pickerId },
      select: { userId: true }
    })
  )
    .map(({ userId }) => userId)
    .sort();

beforeEach(() => {
  vi.stubEnv('SCRAPEBADGER_API_KEY', 'scrapebadger-key');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const network = fakeNetwork();
  network.json(TWEET, {
    id: TWEET_ID,
    text: 'Retweet to win',
    created_at: '2026-09-01T00:00:00.000Z',
    retweet_count: 2
  });
  network.json(`${TWEET}/retweeters`, {
    data: [xUser('x-1'), xUser('x-2')]
  });
});

describe('scrapeTwitterWorkflow', () => {
  it('stores the tweet and its retweeters and completes the picker', async () => {
    const picker = await createPicker();

    await scrapeTwitterWorkflow({ tweetIds: [TWEET_ID], pickerId: picker.id });

    expect(await storedTweets(picker.id)).toEqual([{ tweetId: TWEET_ID }]);
    expect(await storedRetweeters(picker.id)).toEqual(['x-1', 'x-2']);
    expect(
      await db.twitterPicker.findUnique({ where: { id: picker.id } })
    ).toMatchObject({ status: 'COMPLETE' });
  });

  it.fails(
    'stores the tweet once when the storeTweetData step runs again (fails until #308 is fixed)',
    async () => {
      const picker = await createPicker();
      const input = { tweetId: TWEET_ID, pickerId: picker.id };

      await storeTweetData(input);
      await storeTweetData(input);

      expect(await storedTweets(picker.id)).toEqual([{ tweetId: TWEET_ID }]);
    }
  );

  it.fails(
    'stores each retweeter once when the storeRetweeters step runs again (fails until #308 is fixed)',
    async () => {
      const picker = await createPicker();
      const input = {
        tweetId: TWEET_ID,
        pickerId: picker.id,
        cursor: undefined
      };

      await storeRetweeters(input);
      await storeRetweeters(input);

      expect(await storedRetweeters(picker.id)).toEqual(['x-1', 'x-2']);
    }
  );

  it.fails(
    'stores each retweeter once when two runs scrape the same picker (fails until #308 is fixed)',
    async () => {
      const picker = await createPicker();
      const input = { tweetIds: [TWEET_ID], pickerId: picker.id };

      await Promise.all([
        scrapeTwitterWorkflow(input),
        scrapeTwitterWorkflow(input)
      ]);

      expect(await storedTweets(picker.id)).toHaveLength(1);
      expect(await storedRetweeters(picker.id)).toEqual(['x-1', 'x-2']);
    }
  );
});
