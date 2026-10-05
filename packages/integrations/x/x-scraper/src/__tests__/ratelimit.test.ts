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
    config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
  }
}));

import { scrapeBadgerCredits } from '../ratelimit';
import { SCRAPEBADGER_CREDIT_LIMIT } from '../settings';
import { redis } from '@giveaway/cache/redis';

const configOf = (limiter: unknown) =>
  (limiter as { config: Record<string, unknown> }).config;

describe('scrapeBadgerCredits', () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('limits credits to the daily ScrapeBadger allowance on a fixed window', () => {
    expect(configOf(scrapeBadgerCredits)).toEqual({
      redis,
      limiter: {
        algorithm: 'fixedWindow',
        tokens: SCRAPEBADGER_CREDIT_LIMIT,
        window: '1 d'
      },
      analytics: true,
      prefix: 'scrapebadger:credits'
    });
  });

  it('allows 20 credits per day', () => {
    expect(configOf(scrapeBadgerCredits).limiter).toMatchObject({
      tokens: 20
    });
  });
});
