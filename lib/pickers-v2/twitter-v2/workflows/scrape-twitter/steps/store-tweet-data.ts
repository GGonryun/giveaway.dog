import prisma from '@/lib/prisma';
import { getTweet } from '@/lib/scrapebadger/procedures/get-tweet';
import { FatalError } from 'workflow';
import { toTwitterPost } from '../shared';

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
    const data = await prisma.twitterPost.create({
      data: toTwitterPost({ pickerId, tweet })
    });
    return data;
  } catch (error) {
    console.error('Error storing tweet data:', error);
    throw new FatalError(
      `Failed to store tweet data for tweetId ${tweetId}: ${error}`
    );
  }
}
