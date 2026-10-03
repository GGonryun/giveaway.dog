import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@giveaway/cache/redis';
import { SCRAPEBADGER_CREDIT_LIMIT } from './settings';

// Single rate limiter for ScrapeBadger credits
// Anonymous users share a pool using key 'anonymous'
// Authenticated users get individual pools using their userId
export const scrapeBadgerCredits = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(SCRAPEBADGER_CREDIT_LIMIT, '1 d'),
  analytics: true,
  prefix: 'scrapebadger:credits'
});
