'use server';

import z from 'zod';

import { procedure } from '@/lib/mrpc/procedures';
import { getSweepstakesCriteria } from '../criteria';
import { PrizeDrawResult } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';

export const disqualifyDraw = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      drawId: z.string(),
      disqualificationReason: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(
    async ({
      input: { sweepstakesId, drawId, disqualificationReason },
      db
    }) => {
      const criteria = await getSweepstakesCriteria({
        db,
        sweepstakesId
      });

      const draw = await db.prizeDraw.findUnique({
        where: {
          id: drawId
        }
      });

      if (!draw) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'Draw not found'
        });
      }

      await db.$transaction(async (tx) => {
        await tx.prizeDraw.update({
          where: {
            id: drawId
          },
          data: {
            result: PrizeDrawResult.DISQUALIFIED,
            disqualificationReason: disqualificationReason?.trim()
          }
        });
      });

      return { success: true };
    }
  );
