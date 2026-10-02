import { Redis } from '@upstash/redis';

const redisUrl = process.env.REDIS_URL!;
const url = new URL(redisUrl);

const redis = new Redis({
  url:
    url.protocol === 'http:'
      ? `${url.protocol}//${url.hostname}:${url.port}`
      : `https://${url.hostname}`,
  token: url.password || ''
});

export { redis };
