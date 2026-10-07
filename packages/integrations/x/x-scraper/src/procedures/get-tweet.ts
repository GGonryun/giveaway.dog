import 'server-only';

import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import { getScrapeBadgerClient } from '../client';
import { scrapeBadgerTweetSchema, type ScrapeBadgerTweet } from '../schemas';

export const getTweet = async ({
  tweetId
}: {
  tweetId: string;
}): Promise<ScrapeBadgerTweet> => {
  console.info(`[ScrapeBadger] Fetching tweet details for tweet ${tweetId}`);

  return parseProviderResponse({
    provider: 'scrapebadger',
    call: 'tweets.getById',
    schema: scrapeBadgerTweetSchema,
    data: await getScrapeBadgerClient().twitter.tweets.getById(tweetId)
  });
};
