'use server';

import { IdentityProvider, PrismaClient } from '@prisma/client';
import {
  BlueskyConnectTaskSchema,
  BlueskyFollowTaskSchema,
  BlueskyLikeTaskSchema,
  BlueskyRepostTaskSchema
} from '../schemas';
import { ValidateTaskInput } from './types';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@giveaway/integration-model/providers';
import { ApplicationError } from '@giveaway/util-errors';
import { isUserFollowingTarget } from '@/lib/bluesky/is-user-following-target';
import { isUserLikingPost } from '@/lib/bluesky/is-user-liking-post';
import { isUserRepostingPost } from '@/lib/bluesky/is-user-reposting-post';

export const checkBlueskyConnect = async (
  db: PrismaClient,
  input: ValidateTaskInput<BlueskyConnectTaskSchema>
) => {
  // check to see if the user has a bluesky account connected
  const user = await db.user.findUnique({
    where: { id: input.userId },
    include: { accounts: true }
  });

  if (
    !user?.accounts?.some(
      (account) =>
        account.provider ===
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[IdentityProvider.BLUESKY]
    )
  ) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User does not have a Bluesky account connected'
    });
  }
};

export async function checkBlueskyFollow(
  db: PrismaClient,
  args: {
    task: BlueskyFollowTaskSchema;
    userId: string;
  }
) {
  const { task, userId } = args;
  const { profileUrl } = task;

  // Extract handle from URL or use directly
  const targetHandle = profileUrl.includes('bsky.app/profile/')
    ? profileUrl.split('bsky.app/profile/')[1].replace(/\/$/, '')
    : profileUrl;

  // Check if the authenticated user follows the target using the agent
  const isFollowing = await isUserFollowingTarget(db, { userId, targetHandle });

  if (!isFollowing) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      silent: true,
      message: `User is not following ${targetHandle} on Bluesky`
    });
  }
}

export async function checkBlueskyLike(
  db: PrismaClient,
  { task, userId }: ValidateTaskInput<BlueskyLikeTaskSchema>
): Promise<void> {
  const hasLiked = await isUserLikingPost(db, {
    userId,
    postUrl: task.postUrl
  });

  if (!hasLiked) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'You have not liked this Bluesky post yet',
      silent: true
    });
  }
}

export async function checkBlueskyRepost(
  db: PrismaClient,
  { task, userId }: ValidateTaskInput<BlueskyRepostTaskSchema>
): Promise<void> {
  const hasReposted = await isUserRepostingPost(db, {
    userId,
    postUrl: task.postUrl
  });

  if (!hasReposted) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      silent: true,
      message: 'You have not reposted this Bluesky post yet'
    });
  }
}
