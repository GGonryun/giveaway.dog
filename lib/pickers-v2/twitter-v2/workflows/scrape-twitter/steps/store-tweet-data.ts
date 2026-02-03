import prisma from '@/lib/prisma';
import { getTweet } from '@/lib/scrapebadger/procedures/get-tweet';
import { Prisma } from '@prisma/client';
import type { Tweet } from 'scrapebadger';
import { FatalError } from 'workflow';

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

const toTwitterPost = ({
  pickerId,
  tweet
}: {
  pickerId: string;
  tweet: Tweet;
}): Prisma.TwitterPostCreateInput => ({
  picker: { connect: { id: pickerId } },
  tweetId: tweet.id,
  text: tweet.text,
  createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
  userId: tweet.user_id,
  username: tweet.username ?? tweet.user_name,
  favoriteCount: Number(tweet.favorite_count),
  retweetCount: Number(tweet.retweet_count),
  replyCount: Number(tweet.reply_count),
  viewCount: Number(tweet.view_count),
  quoteCount: Number(tweet.quote_count)
});
