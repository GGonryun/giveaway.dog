import 'server-only';

import { getTweetCached } from '@giveaway/x-scraper/procedures/get-tweet-cached';
import { getRetweetersUntilCached } from '@giveaway/x-scraper/procedures/get-retweeters-cached';
import { calculateApiCalls } from '@giveaway/x-picker-model/calculate-api-calls';
import type { ScrapeBadgerUser } from '@giveaway/x-scraper/schemas';

interface FetchRetweetersResult {
  users: ScrapeBadgerUser[];
  tweet: Awaited<ReturnType<typeof getTweetCached>>;
}

export async function fetchRetweetersWithCoverage(
  tweetId: string
): Promise<FetchRetweetersResult> {
  const tweet = await getTweetCached({ tweetId });

  const retweetCount = Number(tweet.retweet_count) || 0;
  const maxApiCalls = calculateApiCalls(retweetCount);

  const startTime = performance.now();
  console.info(
    `[fetchRetweetersWithCoverage] Tweet ${tweetId} has ${retweetCount} retweets, using ${maxApiCalls} API calls`
  );

  const fetchedUsers = await getRetweetersUntilCached({
    tweetId,
    maxApiCalls
  });

  const duration = performance.now() - startTime;

  console.info(
    `[fetchRetweetersWithCoverage] Fetched ${fetchedUsers.users.length} retweeters for tweet ${tweetId} in ${duration.toFixed(2)}ms`
  );

  return {
    users: fetchedUsers.users,
    tweet
  };
}
