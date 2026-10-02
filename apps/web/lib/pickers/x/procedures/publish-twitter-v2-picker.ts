'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { twitterV2PickerFormSchema } from '../schemas/form';
import { ApplicationError } from '@/lib/errors';
import { findUserTeam } from '@/procedures/teams/find-user-team';
import { TeamPermission } from '@/lib/permissions';
import { TeamTier } from '@prisma/client';

export const publishTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      slug: z.string(),
      data: twitterV2PickerFormSchema({ validateTiming: true })
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
      tier: TeamTier.FREE
    });

    const picker = await db.twitterPicker.findUnique({
      where: { id: pickerId, teamId: team.id }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL;
    const response = await fetch(`${base}/api/workflows/twitter/scrape/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({ pickerId, slug, data })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApplicationError({
        code: 'CONFLICT',
        message: error.error || 'Failed to start scrape workflow'
      });
    }

    return { success: true };
  });
