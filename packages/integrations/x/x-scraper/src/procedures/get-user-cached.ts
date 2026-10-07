import 'server-only';

import { redis } from '@giveaway/cache/redis';
import { getUser } from './get-user';
import { scrapeBadgerUserSchema, type ScrapeBadgerUser } from '../schemas';

// 24 hours - user details tend to change less frequently than tweets, so we can cache for longer
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export const getUserCached = async ({
  username
}: {
  username: string;
}): Promise<ScrapeBadgerUser> => {
  const cacheKey = `scrapebadger:user:${username.toLowerCase()}`;

  const cached = scrapeBadgerUserSchema.safeParse(await redis.get(cacheKey));
  if (cached.success) {
    console.info(
      `[ScrapeBadger] Using cached user details for username ${username}`
    );
    return cached.data;
  }

  console.info(`[ScrapeBadger] Fetching fresh user data for ${username}`);

  const user = await getUser({ username });

  await redis.set(cacheKey, user, { ex: CACHE_TTL_SECONDS });

  return user;
};
