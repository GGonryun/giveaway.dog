import 'server-only';

import { redis } from '@giveaway/cache/redis';
import { getRetweetersUntil } from './get-retweeters';
import type { User } from 'scrapebadger';

// 1 hour
const CACHE_TTL_SECONDS = 60 * 60;

interface RetweetersResult {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
}

export const getRetweetersUntilCached = async ({
  tweetId,
  maxApiCalls
}: {
  tweetId: string;
  maxApiCalls: number;
}): Promise<RetweetersResult> => {
  const cacheKey = `scrapebadger:retweeters:${tweetId}:${maxApiCalls}`;

  const cached = await redis.get<RetweetersResult>(cacheKey);
  if (cached) {
    console.info(
      `[ScrapeBadger] Using cached retweeters for tweet ${tweetId} (${cached.users.length} users, maxApiCalls=${maxApiCalls})`
    );
    return cached;
  }

  console.info(
    `[ScrapeBadger] Fetching fresh retweeters for tweet ${tweetId} (${maxApiCalls} calls)`
  );

  const result = await getRetweetersUntil({
    tweetId,
    maxApiCalls
  });

  await redis.set(cacheKey, result, { ex: CACHE_TTL_SECONDS });

  console.info(
    `[ScrapeBadger] Cached retweeters for tweet ${tweetId} (${result.users.length} users, maxApiCalls=${maxApiCalls})`
  );

  return result;
};
