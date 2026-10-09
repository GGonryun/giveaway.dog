'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  twitterV2PickerSchema,
  calculateTwitterV2PickerStats
} from '@giveaway/x-picker-model/schemas/details';

export const getTwitterV2Picker = procedure(
  'x-picker-server/getTwitterV2Picker'
)
  .authorization({
    required: false
  })
  .input(z.object({ pickerId: z.string() }))
  .output(twitterV2PickerSchema)
  .handler(async ({ db, input }) => {
    const picker = await db.twitterPicker.findUnique({
      where: { id: input.pickerId },
      include: {
        users: true,
        draws: true,
        tweets: true
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    const usersWithEligibility = picker.users.map((user) => {
      const ineligible = getDisqualificationReason(user, picker);
      return {
        ...user,
        ineligible
      };
    });

    const stats = calculateTwitterV2PickerStats({
      teamId: picker.teamId,
      users: usersWithEligibility,
      tweets: picker.tweets
    });

    return {
      ...picker,
      teamId: picker.teamId,
      users: usersWithEligibility,
      draws: picker.draws,
      tweets: picker.tweets,
      stats
    };
  });

function getDisqualificationReason(
  user: {
    tweetCount: number | null;
    followersCount: number | null;
    followingCount: number | null;
    profileImageUrl: string | null;
    bannerImageUrl: string | null;
    location: string | null;
    description: string | null;
    createdAt: Date | null;
  },
  picker: {
    minPostCount: number | null;
    minFollowersCount: number | null;
    minFollowingCount: number | null;
    minAccountAgeDays: number | null;
    requireProfileImage: boolean | null;
    requireBannerImage: boolean | null;
    requireLocation: boolean | null;
    requireBio: boolean | null;
  }
): string | undefined {
  if (
    picker.minPostCount !== null &&
    (user.tweetCount ?? 0) < picker.minPostCount
  ) {
    return `Minimum ${picker.minPostCount} posts required`;
  }

  if (
    picker.minFollowersCount !== null &&
    (user.followersCount ?? 0) < picker.minFollowersCount
  ) {
    return `Minimum ${picker.minFollowersCount} followers required`;
  }

  if (
    picker.minFollowingCount !== null &&
    (user.followingCount ?? 0) < picker.minFollowingCount
  ) {
    return `Minimum ${picker.minFollowingCount} following required`;
  }

  if (picker.minAccountAgeDays !== null && user.createdAt) {
    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAgeDays < picker.minAccountAgeDays) {
      return `Account must be at least ${picker.minAccountAgeDays} days old`;
    }
  }

  if (picker.requireProfileImage && !user.profileImageUrl) {
    return 'Profile image required';
  }

  if (picker.requireBannerImage && !user.bannerImageUrl) {
    return 'Banner image required';
  }

  if (picker.requireLocation && !user.location) {
    return 'Location required';
  }

  if (picker.requireBio && !user.description) {
    return 'Bio required';
  }

  return undefined;
}
