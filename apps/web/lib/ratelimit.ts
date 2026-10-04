import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@giveaway/cache/redis';

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

export const fileUpload = {
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'file-upload:global'
  }),
  user: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 d'),
    analytics: true,
    prefix: 'file-upload:user'
  })
};
