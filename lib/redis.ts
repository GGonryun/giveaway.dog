import { Redis } from '@upstash/redis';

const url = new URL(process.env.REDIS_URL!);

const redis = new Redis({
  url: `https://${url.hostname}`,
  token: url.password
});

export { redis };
