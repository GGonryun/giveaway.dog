'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { twitterV2PickerFormSchema } from '@giveaway/x-picker-model/schemas/form';
import { ApplicationError } from '@giveaway/util-errors';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import { environment } from '@giveaway/app-config/environment';

export const publishTwitterV2Picker = procedure(
  'x-picker-server/publishTwitterV2Picker'
)
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

    const base = environment.appUrl();
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
