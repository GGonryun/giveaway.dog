import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

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

export const newVersionedRateLimiter = ({
  prefix,
  max,
  window: { value, unit }
}: {
  prefix: string;
  max: number;
  window: {
    value: number;
    unit: 'ms' | 's' | 'm' | 'h' | 'd';
  };
}) => {
  const version = `${max}-${value}-${unit}`;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(max, `${value} ${unit}`),
    analytics: true,
    prefix: `${prefix}:${version}`
  });
};
