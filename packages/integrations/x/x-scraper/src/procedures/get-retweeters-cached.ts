import 'server-only';

import { z } from 'zod';
import { redis } from '@giveaway/cache/redis';
import { getRetweetersUntil } from './get-retweeters';
import { scrapeBadgerUserSchema } from '../schemas';

// 1 hour
const CACHE_TTL_SECONDS = 60 * 60;

const retweetersResultSchema = z.object({
  users: z.array(scrapeBadgerUserSchema),
  nextCursor: z
    .string()
    .nullish()
    .transform((cursor) => cursor ?? undefined),
  hasMore: z.boolean()
});

type RetweetersResult = z.infer<typeof retweetersResultSchema>;

export const getRetweetersUntilCached = async ({
  tweetId,
  maxApiCalls
}: {
  tweetId: string;
  maxApiCalls: number;
}): Promise<RetweetersResult> => {
  const cacheKey = `scrapebadger:retweeters:${tweetId}:${maxApiCalls}`;

  const cached = retweetersResultSchema.safeParse(await redis.get(cacheKey));
  if (cached.success) {
    console.info(
      `[ScrapeBadger] Using cached retweeters for tweet ${tweetId} (${cached.data.users.length} users, maxApiCalls=${maxApiCalls})`
    );
    return cached.data;
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
