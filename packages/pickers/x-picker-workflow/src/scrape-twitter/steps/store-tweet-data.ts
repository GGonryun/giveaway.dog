import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { getTweet } from '@giveaway/x-scraper/procedures/get-tweet';
import { toTwitterPost } from '../shared';
import { toStepError } from '../errors';

export async function storeTweetData({
  tweetId,
  pickerId
}: {
  pickerId: string;
  tweetId: string;
}) {
  'use step';

  try {
    const tweet = await getTweet({ tweetId });
    await prisma.twitterPost.createMany({
      data: toTwitterPost({ pickerId, tweet }),
      skipDuplicates: true
    });
    return await prisma.twitterPost.findUniqueOrThrow({
      where: { pickerId_tweetId: { pickerId, tweetId: tweet.id } }
    });
  } catch (error) {
    console.error('Error storing tweet data:', error);
    throw toStepError(
      error,
      `Failed to store tweet data for tweetId ${tweetId}`
    );
  }
}
