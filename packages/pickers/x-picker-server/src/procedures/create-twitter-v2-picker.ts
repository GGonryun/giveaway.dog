'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { nanoid } from 'nanoid';
import { TeamPermission } from '@giveaway/team-permissions';
import { LastPostedType, PickerStatus, TeamTier } from '@giveaway/db-model';

export const createTwitterPicker = procedure(
  'x-picker-server/createTwitterPicker'
)
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ db, input, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_PICKERS,
      tier: TeamTier.PRO
    });

    const created = await db.twitterPicker.create({
      data: {
        id: nanoid(10),
        teamId: team.id,
        status: PickerStatus.DRAFT,
        tweetUrls: [],
        winners: 1,
        minPostCount: 100,
        minAccountAgeDays: 100,
        minFollowersCount: 100,
        minFollowingCount: 100,
        lastPostWithin: LastPostedType.PAST_MONTH,
        requireProfileImage: true,
        requireBannerImage: false,
        requireLocation: false,
        requireBio: false,
        runAt: null
      }
    });

    return created;
  });
