'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { twitterV2PickerDrawSchema } from '../schemas/details';

export const drawTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      count: z.number().optional()
    })
  )
  .output(z.array(twitterV2PickerDrawSchema))
  .handler(async ({ db, input }) => {
    const picker = await db.twitterPicker.findUnique({
      where: { id: input.pickerId },
      include: {
        users: true,
        draws: true
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    if (picker.status !== 'COMPLETE') {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Picker must be in COMPLETE status to draw winners'
      });
    }

    const eligibleUsers = picker.users.filter((user) => {
      return !getDisqualificationReason(user, picker);
    });

    if (eligibleUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No eligible users to draw from'
      });
    }

    const existingWinnerIds = new Set(picker.draws.map((d) => d.userId));
    const availableUsers = eligibleUsers.filter(
      (u) => !existingWinnerIds.has(u.id)
    );

    if (availableUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'All eligible users have already been drawn as winners'
      });
    }

    const winnersToSelect = input.count ?? picker.winners;
    const actualWinnersCount = Math.min(winnersToSelect, availableUsers.length);

    const selectedWinners = selectRandomUnique(
      availableUsers,
      actualWinnersCount
    );

    const createdDraws = await db.$transaction(
      selectedWinners.map((user) =>
        db.twitterPickerDraw.create({
          data: {
            pickerId: picker.id,
            userId: user.id
          }
        })
      )
    );

    return createdDraws;
  });

function selectRandomUnique<T>(array: T[], count: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

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
