'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

export const disqualifyTwitterV2Winner = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      drawId: z.string(),
      reason: z.string().min(1, 'Reason is required')
    })
  )
  .handler(async ({ db, input }) => {
    const draw = await db.twitterPickerDraw.findUnique({
      where: { id: input.drawId }
    });

    if (!draw) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Draw not found'
      });
    }

    await db.twitterPickerDraw.update({
      where: { id: input.drawId },
      data: { disqualified: input.reason }
    });

    return { success: true };
  });
