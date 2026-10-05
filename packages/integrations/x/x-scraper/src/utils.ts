import 'server-only';

import { Prisma } from '@giveaway/db-model';
import { Tweet, User } from 'scrapebadger';
import { TwitterUserSchema } from '@giveaway/integration-model/api';

export const toTwitterUserSchema = (user: User): TwitterUserSchema => ({
  id: user.id,
  name: user.name,
  username: user.username,
  created_at: user.created_at ? new Date(user.created_at) : new Date(),
  description: user.description,
  location: user.location,
  profile_image_url: user.profile_image_url,
  profile_banner_url: user.banner_image_url,
  protected: false,
  verified: user.verified,
  verified_type: user.verified_type,
  public_metrics: {
    followers_count: user.followers_count,
    following_count: user.following_count,
    tweet_count: user.tweet_count
  }
});

export const toTwitterPickerUsers = ({
  pickerId,
  users
}: {
  users: User[];
  pickerId: string;
}): Prisma.TwitterPickerUserCreateManyInput[] => {
  return users.map((user) => ({
    pickerId,
    userId: user.id,
    username: user.username,
    name: user.name,
    description: user.description,
    url: user.url,
    location: user.location,
    profileImageUrl: user.profile_image_url,
    bannerImageUrl: user.profile_banner_url,
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    canDm: user.can_dm,
    followersCount: user.followers_count,
    followingCount: user.following_count,
    tweetCount: user.tweet_count,
    verified: user.verified
  }));
};

export const toTwitterPost = ({
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

export const extractTweetId = (url: string): string | null => {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /t\.co\/(\w+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};
