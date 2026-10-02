'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { twitterV2PickerFormSchema } from '../schemas/form';
import { ApplicationError } from '@/lib/errors';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { TeamPermission } from '@/lib/permissions';
import { TeamTier } from '@prisma/client';

export const updateTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      slug: z.string(),
      data: twitterV2PickerFormSchema({ validateTiming: false })
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, input, user }) => {
    const { pickerId, data, slug } = input;

    const { team } = await findUserTeam({
      db,
      user,
      slug,
      permission: TeamPermission.UPDATE_PICKERS,
      tier: TeamTier.PRO
    });

    const picker = await db.twitterPicker.findUnique({
      where: { id: pickerId }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    if (picker.teamId !== team.id) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this picker'
      });
    }

    await db.twitterPicker.update({
      where: { id: pickerId },
      data: {
        tweetUrls: data.setup.postUrls.map((item) => item.url),
        winners: data.winners.quota,
        minPostCount: data.filters.minimumPostCount,
        minAccountAgeDays: data.filters.minimumAccountAgeDays,
        minFollowersCount: data.filters.minimumFollowers,
        minFollowingCount: data.filters.minimumFollowing,
        requireProfileImage: data.filters.hasProfileImage,
        requireBannerImage: data.filters.hasBanner,
        requireLocation: data.filters.hasLocation,
        requireBio: data.filters.hasDescription,
        lastPostWithin: data.filters.lastPostWithin,
        runAt: data.timing?.runAt ? new Date(data.timing.runAt) : null
      }
    });

    return { success: true };
  });
