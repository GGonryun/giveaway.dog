import { describe, it, expect, vi, afterAll } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('REDIS_URL', 'rediss://default:token@ratelimit.upstash.io:6379');
});

vi.mock('@upstash/redis', () => ({
  Redis: class {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  }
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static fixedWindow = (tokens: number, window: string) => ({
      algorithm: 'fixedWindow',
      tokens,
      window
    });
    static slidingWindow = (tokens: number, window: string) => ({
      algorithm: 'slidingWindow',
      tokens,
      window
    });
    config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
  }
}));

import { fileUpload, newVersionedRateLimiter } from '../ratelimit';
import { redis } from '@giveaway/cache/redis';

const configOf = (limiter: unknown) =>
  (limiter as { config: Record<string, unknown> }).config;

describe('ratelimit', () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('newVersionedRateLimiter', () => {
    it('creates a fixed window limiter with a versioned prefix', () => {
      const limiter = newVersionedRateLimiter({
        prefix: 'pickers',
        max: 5,
        window: { value: 10, unit: 'm' }
      });

      expect(configOf(limiter)).toEqual({
        redis,
        limiter: { algorithm: 'fixedWindow', tokens: 5, window: '10 m' },
        analytics: true,
        prefix: 'pickers:5-10-m'
      });
    });

    it('changes the prefix version when the limits change', () => {
      const first = newVersionedRateLimiter({
        prefix: 'api',
        max: 100,
        window: { value: 1, unit: 'h' }
      });
      const second = newVersionedRateLimiter({
        prefix: 'api',
        max: 50,
        window: { value: 1, unit: 'h' }
      });

      expect(configOf(first).prefix).toBe('api:100-1-h');
      expect(configOf(second).prefix).toBe('api:50-1-h');
    });

    it.each(['ms', 's', 'm', 'h', 'd'] as const)(
      'passes the %s unit through to the window',
      (unit) => {
        const limiter = newVersionedRateLimiter({
          prefix: 'p',
          max: 1,
          window: { value: 2, unit }
        });

        expect(configOf(limiter).limiter).toMatchObject({
          window: `2 ${unit}`
        });
      }
    );
  });

  describe('fileUpload', () => {
    it('limits global uploads to 10 per hour on a sliding window', () => {
      expect(configOf(fileUpload.global)).toEqual({
        redis,
        limiter: { algorithm: 'slidingWindow', tokens: 10, window: '1 h' },
        analytics: true,
        prefix: 'file-upload:global'
      });
    });

    it('limits uploads per user to 20 per day on a sliding window', () => {
      expect(configOf(fileUpload.user)).toEqual({
        redis,
        limiter: { algorithm: 'slidingWindow', tokens: 20, window: '1 d' },
        analytics: true,
        prefix: 'file-upload:user'
      });
    });
  });

  describe('shared redis client', () => {
    it('uses the configured upstash redis instance', () => {
      expect(
        (redis as unknown as { options: { url: string; token: string } })
          .options
      ).toEqual({ url: 'https://ratelimit.upstash.io', token: 'token' });
    });
  });
});
