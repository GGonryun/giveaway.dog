import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scrapeBadgerAuthor,
  scrapeBadgerUserResponse
} from '../../testing/fixtures-scrapebadger';
import { getUserCached } from '../get-user-cached';

const m = vi.hoisted(() => ({
  redis: { get: vi.fn(), set: vi.fn() },
  getByUsername: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('@giveaway/cache/redis', () => ({
  redis: m.redis
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

describe('getUserCached', () => {
  const user = scrapeBadgerAuthor();

  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    m.redis.get.mockReset();
    m.redis.set.mockReset();
    m.redis.set.mockResolvedValue('OK');
    m.getByUsername.mockReset();
    m.getByUsername.mockResolvedValue(scrapeBadgerUserResponse);
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { users: { getByUsername: m.getByUsername } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads the cache using the lowercased username key', async () => {
    m.redis.get.mockResolvedValue(null);

    await getUserCached({ username: 'AliCE' });

    expect(m.redis.get).toHaveBeenCalledWith('scrapebadger:user:alice');
  });

  describe('when the user is cached', () => {
    it('returns the cached user without calling the API', async () => {
      const cached = { id: '1', username: 'cached' };
      m.redis.get.mockResolvedValue(cached);

      const result = await getUserCached({ username: 'alice' });

      expect(result).toBe(cached);
      expect(m.getByUsername).not.toHaveBeenCalled();
      expect(m.redis.set).not.toHaveBeenCalled();
    });

    it('logs that the cached user was used', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      m.redis.get.mockResolvedValue({ id: '1' });

      await getUserCached({ username: 'Alice' });

      expect(infoSpy).toHaveBeenCalledWith(
        '[ScrapeBadger] Using cached user details for username Alice'
      );
    });
  });

  describe('when the user is not cached', () => {
    it('fetches the user with the original username casing', async () => {
      m.redis.get.mockResolvedValue(null);

      const result = await getUserCached({ username: 'AliCE' });

      expect(m.getByUsername).toHaveBeenCalledWith('AliCE');
      expect(result).toEqual(user);
    });

    it('caches the fetched user for 24 hours under the lowercased key', async () => {
      m.redis.get.mockResolvedValue(null);

      await getUserCached({ username: 'AliCE' });

      expect(m.redis.set).toHaveBeenCalledWith(
        'scrapebadger:user:alice',
        user,
        { ex: 86400 }
      );
    });

    it('treats an empty string cache entry as a miss', async () => {
      m.redis.get.mockResolvedValue('');

      const result = await getUserCached({ username: 'alice' });

      expect(m.getByUsername).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });

    it('propagates cache write failures', async () => {
      m.redis.get.mockResolvedValue(null);
      m.redis.set.mockRejectedValue(new Error('redis down'));

      await expect(getUserCached({ username: 'alice' })).rejects.toThrow(
        'redis down'
      );
    });

    it('does not cache anything when the API call fails', async () => {
      m.redis.get.mockResolvedValue(null);
      m.getByUsername.mockRejectedValue(new Error('suspended'));

      await expect(getUserCached({ username: 'alice' })).rejects.toThrow(
        'suspended'
      );
      expect(m.redis.set).not.toHaveBeenCalled();
    });
  });

  it('propagates cache read failures without calling the API', async () => {
    m.redis.get.mockRejectedValue(new Error('redis down'));

    await expect(getUserCached({ username: 'alice' })).rejects.toThrow(
      'redis down'
    );
    expect(m.getByUsername).not.toHaveBeenCalled();
  });
});
