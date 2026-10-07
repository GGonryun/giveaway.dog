import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCall,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import { scrapeBadgerTweetSchema } from '../../schemas';
import { scrapeBadgerTweetResponse } from '../../testing/fixtures-scrapebadger';
import { toTwitterPost } from '../../utils';
import { getTweet } from '../get-tweet';

const fetchMock = vi.fn();

describe('ScrapeBadger tweets.getById contract', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(scrapeBadgerTweetResponse));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that getTweet uses', () => {
    expect(() =>
      scrapeBadgerTweetSchema.parse(scrapeBadgerTweetResponse)
    ).not.toThrow();
  });

  it('requests the tweet from the ScrapeBadger API with the API key', async () => {
    await getTweet({ tweetId: '1975236458112819456' });

    const { url, init } = fetchCall(fetchMock);
    expect(url).toBe(
      'https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456'
    );
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({ 'X-API-Key': 'sb-key' });
  });

  it('returns the fields of the recorded tweet that the app reads', async () => {
    const tweet = await getTweet({ tweetId: '1975236458112819456' });

    expect(tweet).toEqual({
      id: '1975236458112819456',
      text: 'Giveaway time! Retweet this post for a chance to win a year of dog treats #giveaway https://t.co/AbCdEf1234',
      created_at: '2026-10-06T16:00:00Z',
      user_id: '1701234567890123456',
      username: 'TheGiveawayDog',
      user_name: 'Giveaway Dog',
      favorite_count: 48,
      retweet_count: 31,
      reply_count: 12,
      quote_count: 2,
      view_count: 5408,
      media: [
        {
          type: 'photo',
          url: 'https://pbs.twimg.com/media/G2AbCdEfGhIjKlM.jpg',
          width: 1200,
          height: 675,
          alt_text: 'A box of dog treats'
        },
        {
          type: 'video',
          url: 'https://video.twimg.com/ext_tw_video/1975236409876543210/pu/vid/avc1/1280x720/AbCdEfGh.mp4',
          width: 1280,
          height: 720,
          alt_text: null
        }
      ]
    });
  });

  it('maps the recorded tweet to the stored post of a picker', async () => {
    const tweet = await getTweet({ tweetId: '1975236458112819456' });

    expect(toTwitterPost({ pickerId: 'picker-1', tweet })).toEqual({
      picker: { connect: { id: 'picker-1' } },
      tweetId: '1975236458112819456',
      text: 'Giveaway time! Retweet this post for a chance to win a year of dog treats #giveaway https://t.co/AbCdEf1234',
      createdAt: new Date('2026-10-06T16:00:00Z'),
      userId: '1701234567890123456',
      username: 'TheGiveawayDog',
      favoriteCount: 48,
      retweetCount: 31,
      replyCount: 12,
      viewCount: 5408,
      quoteCount: 2
    });
  });
});
