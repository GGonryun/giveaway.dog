import 'server-only';

import { getScrapeBadgerClient } from '../client';
import { parseScrapeBadgerResponse } from '../parse';
import { scrapeBadgerTweetSchema } from '../schemas';
import type { Tweet } from 'scrapebadger';

export const getTweet = async ({
  tweetId
}: {
  tweetId: string;
}): Promise<Tweet> => {
  console.info(`[ScrapeBadger] Fetching tweet details for tweet ${tweetId}`);

  const tweet = await getScrapeBadgerClient().twitter.tweets.getById(tweetId);

  return parseScrapeBadgerResponse(scrapeBadgerTweetSchema, tweet, 'tweet');
};
