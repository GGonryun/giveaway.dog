'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { nanoid } from 'nanoid';
import { TeamPermission } from '@/lib/permissions';
import { PickerStatus } from '@prisma/client';

export const createTwitterPicker = procedure()
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
      permission: TeamPermission.UPDATE_PICKERS
    });

    const created = await db.twitterPicker.create({
      data: {
        id: nanoid(10),
        teamId: team.id,
        status: PickerStatus.DRAFT,
        seed: Math.floor(Math.random() * 1000000),
        winners: 1,
        minPostCount: null,
        minAccountAgeDays: null,
        minFollowersCount: null,
        minFollowingCount: null,
        requireProfileImage: false,
        requireBannerImage: false,
        requireLocation: false,
        requireBio: false,
        runAt: null
      }
    });

    return created;
  });
