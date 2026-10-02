import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRetweetersUntilCached } from '../get-retweeters-cached';

const m = vi.hoisted(() => ({
  redis: { get: vi.fn(), set: vi.fn() },
  getRetweeters: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('@/lib/redis', () => ({
  redis: m.redis
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

const user = (id: string) => ({ id, username: `user${id}` });

describe('getRetweetersUntilCached', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    m.redis.get.mockReset();
    m.redis.set.mockReset();
    m.redis.set.mockResolvedValue('OK');
    m.getRetweeters.mockReset();
    m.getRetweeters.mockResolvedValue({
      data: [user('1'), user('2')],
      nextCursor: 'c-2',
      hasMore: true
    });
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { tweets: { getRetweeters: m.getRetweeters } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads the cache using a key that includes the tweet id and call budget', async () => {
    m.redis.get.mockResolvedValue(null);

    await getRetweetersUntilCached({ tweetId: 't-1', maxApiCalls: 3 });

    expect(m.redis.get).toHaveBeenCalledWith('scrapebadger:retweeters:t-1:3');
  });

  describe('when the retweeters are cached', () => {
    it('returns the cached result without calling the API', async () => {
      const cached = { users: [user('9')], nextCursor: 'x', hasMore: true };
      m.redis.get.mockResolvedValue(cached);

      const result = await getRetweetersUntilCached({
        tweetId: 't-1',
        maxApiCalls: 3
      });

      expect(result).toBe(cached);
      expect(m.getRetweeters).not.toHaveBeenCalled();
      expect(m.redis.set).not.toHaveBeenCalled();
    });

    it('logs the number of cached users', async () => {
      m.redis.get.mockResolvedValue({ users: [user('9')], hasMore: false });

      await getRetweetersUntilCached({ tweetId: 't-1', maxApiCalls: 3 });

      expect(console.info).toHaveBeenCalledWith(
        '[ScrapeBadger] Using cached retweeters for tweet t-1 (1 users, maxApiCalls=3)'
      );
    });
  });

  describe('when the retweeters are not cached', () => {
    it('fetches retweeters limited to the call budget', async () => {
      m.redis.get.mockResolvedValue(null);

      const result = await getRetweetersUntilCached({
        tweetId: 't-1',
        maxApiCalls: 1
      });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', {
        cursor: undefined,
        count: 20
      });
      expect(result).toEqual({
        users: [user('1'), user('2')],
        nextCursor: 'c-2',
        hasMore: true
      });
    });

    it('caches the fetched result for one hour', async () => {
      m.redis.get.mockResolvedValue(null);

      const result = await getRetweetersUntilCached({
        tweetId: 't-1',
        maxApiCalls: 1
      });

      expect(m.redis.set).toHaveBeenCalledWith(
        'scrapebadger:retweeters:t-1:1',
        result,
        { ex: 3600 }
      );
    });

    it('logs the number of users that were cached', async () => {
      m.redis.get.mockResolvedValue(null);

      await getRetweetersUntilCached({ tweetId: 't-1', maxApiCalls: 1 });

      expect(console.info).toHaveBeenCalledWith(
        '[ScrapeBadger] Cached retweeters for tweet t-1 (2 users, maxApiCalls=1)'
      );
    });

    it('does not cache anything when the API call fails', async () => {
      m.redis.get.mockResolvedValue(null);
      m.getRetweeters.mockRejectedValue(new Error('rate limited'));

      await expect(
        getRetweetersUntilCached({ tweetId: 't-1', maxApiCalls: 1 })
      ).rejects.toThrow('rate limited');
      expect(m.redis.set).not.toHaveBeenCalled();
    });
  });

  it('propagates cache read failures without calling the API', async () => {
    m.redis.get.mockRejectedValue(new Error('redis down'));

    await expect(
      getRetweetersUntilCached({ tweetId: 't-1', maxApiCalls: 1 })
    ).rejects.toThrow('redis down');
    expect(m.getRetweeters).not.toHaveBeenCalled();
  });
});
