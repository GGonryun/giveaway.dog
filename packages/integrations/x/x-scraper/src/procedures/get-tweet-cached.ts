import 'server-only';

import { redis } from '@giveaway/cache/redis';
import { getTweet } from './get-tweet';
import { scrapeBadgerTweetSchema, type ScrapeBadgerTweet } from '../schemas';

// 1 hour
const CACHE_TTL_SECONDS = 60 * 60;

export const getTweetCached = async ({
  tweetId
}: {
  tweetId: string;
}): Promise<ScrapeBadgerTweet> => {
  const cacheKey = `scrapebadger:tweet:${tweetId}`;

  const cached = scrapeBadgerTweetSchema.safeParse(await redis.get(cacheKey));
  if (cached.success) {
    console.info(
      `[ScrapeBadger] Using cached tweet details for tweet ${tweetId}`
    );
    return cached.data;
  }

  console.info(`[ScrapeBadger] Fetching fresh tweet data for ${tweetId}`);

  const tweet = await getTweet({ tweetId });

  await redis.set(cacheKey, tweet, { ex: CACHE_TTL_SECONDS });

  return tweet;
};
