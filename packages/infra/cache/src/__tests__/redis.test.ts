import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@upstash/redis', () => ({
  Redis: class {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  }
}));

const loadRedis = async (redisUrl: string | undefined) => {
  vi.stubEnv('REDIS_URL', redisUrl);
  const { redis } = await import('../redis');
  return redis as unknown as { options: { url: string; token: string } };
};

describe('redis', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('connects over https to the host of a rediss url using its password as token', async () => {
    const redis = await loadRedis(
      'rediss://default:secret-token@eu1-fancy-cat.upstash.io:6379'
    );

    expect(redis.options).toEqual({
      url: 'https://eu1-fancy-cat.upstash.io',
      token: 'secret-token'
    });
  });

  it('drops the port of non http urls', async () => {
    const redis = await loadRedis('https://user:pw@example.com:8443');

    expect(redis.options).toEqual({
      url: 'https://example.com',
      token: 'pw'
    });
  });

  it('keeps the protocol, host and port of http urls', async () => {
    const redis = await loadRedis('http://:local-token@localhost:8079');

    expect(redis.options).toEqual({
      url: 'http://localhost:8079',
      token: 'local-token'
    });
  });

  it('uses an empty token when the url has no password', async () => {
    const redis = await loadRedis('http://localhost:8079');

    expect(redis.options.token).toBe('');
  });

  it('leaves a dangling colon for http urls without a port', async () => {
    const redis = await loadRedis('http://localhost');

    expect(redis.options.url).toBe('http://localhost:');
  });

  it('throws at import time when REDIS_URL is not set', async () => {
    await expect(loadRedis(undefined)).rejects.toThrow(TypeError);
  });

  it('throws at import time when REDIS_URL is not a valid url', async () => {
    await expect(loadRedis('not a url')).rejects.toThrow(TypeError);
  });
});
