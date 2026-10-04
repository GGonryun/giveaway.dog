'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { twitterV2PickerUnvalidatedFormSchema } from '@giveaway/x-picker-model/schemas/form';
import { ApplicationError } from '@giveaway/util-errors';

export const getTwitterV2PickerForm = procedure()
  .authorization({
    required: true
  })
  .input(z.object({ pickerId: z.string() }))
  .output(twitterV2PickerUnvalidatedFormSchema)
  .handler(async ({ db, input }) => {
    const picker = await db.twitterPicker.findUnique({
      where: { id: input.pickerId }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    return {
      setup: {
        postUrls:
          picker.tweetUrls.length > 0
            ? picker.tweetUrls.map((url) => ({ url }))
            : [{ url: '' }]
      },
      actions: {
        repost: true, // V2 always requires repost
        reply: false // TODO: Add reply support
      },
      timing: picker.runAt
        ? {
            runAt: picker.runAt.toISOString(),
            timeZone: 'UTC' // TODO: Store timezone in database
          }
        : null,
      winners: {
        quota: picker.winners
      },
      filters: {
        minimumPostCount: picker.minPostCount,
        minimumAccountAgeDays: picker.minAccountAgeDays,
        minimumFollowers: picker.minFollowersCount,
        minimumFollowing: picker.minFollowingCount,
        lastPostWithin: picker.lastPostWithin,
        hasProfileImage: picker.requireProfileImage ?? false,
        hasBanner: picker.requireBannerImage ?? false,
        hasLocation: picker.requireLocation ?? false,
        hasDescription: picker.requireBio ?? false
      }
    };
  });
