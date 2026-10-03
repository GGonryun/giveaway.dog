import { redis } from '@giveaway/cache/redis';
import { getUser } from './get-user';
import type { User } from 'scrapebadger';

// 24 hours - user details tend to change less frequently than tweets, so we can cache for longer
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export const getUserCached = async ({
  username
}: {
  username: string;
}): Promise<User> => {
  const cacheKey = `scrapebadger:user:${username.toLowerCase()}`;

  const cached = await redis.get<User>(cacheKey);
  if (cached) {
    console.info(
      `[ScrapeBadger] Using cached user details for username ${username}`
    );
    return cached;
  }

  console.info(`[ScrapeBadger] Fetching fresh user data for ${username}`);

  const user = await getUser({ username });

  await redis.set(cacheKey, user, { ex: CACHE_TTL_SECONDS });

  return user;
};
