import { Prisma } from '@prisma/client';
import { Tweet, User } from 'scrapebadger';

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
