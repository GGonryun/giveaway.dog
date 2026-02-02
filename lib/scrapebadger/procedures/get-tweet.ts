import { getScrapeBadgerClient } from '../client';
import { Tweet } from 'scrapebadger';

export const getTweet = async ({
  tweetId
}: {
  tweetId: string;
}): Promise<Tweet> => {
  console.info(`[ScrapeBadger] Fetching tweet details for tweet ${tweetId}`);

  return await getScrapeBadgerClient().twitter.tweets.getById(tweetId);
};
