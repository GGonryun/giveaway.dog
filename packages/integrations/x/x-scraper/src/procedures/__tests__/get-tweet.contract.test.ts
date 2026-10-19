import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { getTweet } from '../get-tweet';
import { scrapeBadgerTweetSchema } from '../../schemas';
import { toTwitterPost } from '../../utils';
import { scrapeBadgerTweetFixture } from '../../testing/fixtures-scrapebadger-tweet';

const URL = `https://scrapebadger.com/v1/twitter/tweets/tweet/${scrapeBadgerTweetFixture.id}`;

describe('ScrapeBadger tweet contract', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded tweet with the schema of the app', () => {
    expect(scrapeBadgerTweetSchema.safeParse(scrapeBadgerTweetFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('turns the recorded tweet into the post that the picker stores', async () => {
    const network = fakeNetwork();
    network.json(URL, scrapeBadgerTweetFixture);

    const tweet = await getTweet({ tweetId: scrapeBadgerTweetFixture.id });

    expect(toTwitterPost({ pickerId: 'picker-1', tweet })).toEqual({
      picker: { connect: { id: 'picker-1' } },
      tweetId: '1900000000000000001',
      text: 'Retweet to enter the Acme giveaway! Winners on Friday.',
      createdAt: new Date('2026-01-05T15:30:00.000Z'),
      userId: '1500000000000000001',
      username: 'acme_giveaways',
      favoriteCount: 128,
      retweetCount: 45,
      replyCount: 17,
      viewCount: 9876,
      quoteCount: 3
    });
  });

  it('rejects a tweet whose counts changed type', async () => {
    const network = fakeNetwork();
    network.json(URL, { ...scrapeBadgerTweetFixture, retweet_count: '45' });

    await expect(
      getTweet({ tweetId: scrapeBadgerTweetFixture.id })
    ).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Invalid ScrapeBadger tweet response'
    });
  });
});
