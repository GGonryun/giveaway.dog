import { Ratelimit } from '@upstash/ratelimit';
import redis from './redis';

export const pickerRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '1 m'),
  analytics: true,
  prefix: 'picker:minute'
});

export const pickerHourlyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'picker:hour'
});
