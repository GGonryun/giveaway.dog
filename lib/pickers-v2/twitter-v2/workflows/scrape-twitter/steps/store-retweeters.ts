import prisma from '@/lib/prisma';
import { getRetweeters } from '@/lib/scrapebadger/procedures/get-retweeters';
import { Prisma } from '@prisma/client';
import type { User } from 'scrapebadger';
import { FatalError } from 'workflow';

export async function storeRetweeters({
  tweetId,
  pickerId,
  cursor
}: {
  tweetId: string;
  pickerId: string;
  cursor: string | undefined;
}) {
  'use step';

  try {
    const retweeters = await getRetweeters({
      tweetId,
      cursor
    });

    await prisma.twitterPickerUser.createMany({
      data: toTwitterPickerUsers({
        pickerId,
        users: retweeters.data
      }),
      skipDuplicates: true
    });

    return retweeters;
  } catch (error) {
    console.error('Error storing retweeters:', error);
    throw new FatalError(
      `Failed to store retweeters for tweetId ${tweetId}: ${error}`
    );
  }
}

const toTwitterPickerUsers = ({
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
