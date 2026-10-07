import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scrapeBadgerTweet,
  scrapeBadgerTweetResponse
} from '../../testing/fixtures-scrapebadger';
import { getTweetCached } from '../get-tweet-cached';

const m = vi.hoisted(() => ({
  redis: { get: vi.fn(), set: vi.fn() },
  getById: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({
  redis: m.redis
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

describe('getTweetCached', () => {
  const tweet = scrapeBadgerTweet();

  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    m.redis.get.mockReset();
    m.redis.set.mockReset();
    m.redis.set.mockResolvedValue('OK');
    m.getById.mockReset();
    m.getById.mockResolvedValue(scrapeBadgerTweetResponse);
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { tweets: { getById: m.getById } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads the cache using the tweet id key', async () => {
    m.redis.get.mockResolvedValue(null);

    await getTweetCached({ tweetId: '123' });

    expect(m.redis.get).toHaveBeenCalledWith('scrapebadger:tweet:123');
  });

  describe('when the tweet is cached', () => {
    it('returns the cached tweet without calling the API', async () => {
      const cached = scrapeBadgerTweet({ id: '123', text: 'cached' });
      m.redis.get.mockResolvedValue(cached);

      const result = await getTweetCached({ tweetId: '123' });

      expect(result).toEqual(cached);
      expect(m.getById).not.toHaveBeenCalled();
      expect(m.redis.set).not.toHaveBeenCalled();
    });

    it('reads the cached tweet with the schema of the API response', async () => {
      m.redis.get.mockResolvedValue({
        id: '123',
        retweet_count: '31',
        media: null
      });

      const result = await getTweetCached({ tweetId: '123' });

      expect(result).toMatchObject({
        id: '123',
        text: '',
        retweet_count: 31,
        favorite_count: 0,
        media: []
      });
      expect(m.getById).not.toHaveBeenCalled();
    });

    it('fetches the tweet again when the cached value has no id', async () => {
      m.redis.get.mockResolvedValue({ text: 'cached by an older version' });

      const result = await getTweetCached({ tweetId: '123' });

      expect(m.getById).toHaveBeenCalledWith('123');
      expect(result).toEqual(tweet);
      expect(m.redis.set).toHaveBeenCalledWith(
        'scrapebadger:tweet:123',
        tweet,
        { ex: 3600 }
      );
    });

    it('logs that the cached tweet was used', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      m.redis.get.mockResolvedValue({ id: '123' });

      await getTweetCached({ tweetId: '123' });

      expect(infoSpy).toHaveBeenCalledWith(
        '[ScrapeBadger] Using cached tweet details for tweet 123'
      );
    });
  });

  describe('when the tweet is not cached', () => {
    it('fetches the tweet from the API', async () => {
      m.redis.get.mockResolvedValue(null);

      const result = await getTweetCached({ tweetId: '123' });

      expect(m.getById).toHaveBeenCalledWith('123');
      expect(result).toEqual(tweet);
    });

    it('caches the fetched tweet for one hour', async () => {
      m.redis.get.mockResolvedValue(null);

      await getTweetCached({ tweetId: '123' });

      expect(m.redis.set).toHaveBeenCalledWith(
        'scrapebadger:tweet:123',
        tweet,
        { ex: 3600 }
      );
    });

    it('treats an empty string cache entry as a miss', async () => {
      m.redis.get.mockResolvedValue('');

      await getTweetCached({ tweetId: '123' });

      expect(m.getById).toHaveBeenCalledTimes(1);
    });

    it('does not cache anything when the API call fails', async () => {
      m.redis.get.mockResolvedValue(null);
      m.getById.mockRejectedValue(new Error('not found'));

      await expect(getTweetCached({ tweetId: '123' })).rejects.toThrow(
        'not found'
      );
      expect(m.redis.set).not.toHaveBeenCalled();
    });

    it('propagates cache write failures', async () => {
      m.redis.get.mockResolvedValue(null);
      m.redis.set.mockRejectedValue(new Error('redis down'));

      await expect(getTweetCached({ tweetId: '123' })).rejects.toThrow(
        'redis down'
      );
    });
  });

  it('propagates cache read failures without calling the API', async () => {
    m.redis.get.mockRejectedValue(new Error('redis down'));

    await expect(getTweetCached({ tweetId: '123' })).rejects.toThrow(
      'redis down'
    );
    expect(m.getById).not.toHaveBeenCalled();
  });
});
