'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import { getSweepstakesCriteria } from '@giveaway/winners-model/criteria';
import { PrizeDrawResult } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

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
        },
        include: {
          taskCompletion: {
            select: {
              participantId: true,
              task: {
                select: {
                  sweepstakesId: true
                }
              }
            }
          }
        }
      });

      if (!draw) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'Draw not found'
        });
      }

      const participantId = draw.taskCompletion.participantId;
      const taskSweepstakesId = draw.taskCompletion.task.sweepstakesId;

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

        await tx.taskCompletion.updateMany({
          where: {
            participantId: participantId,
            task: {
              sweepstakesId: taskSweepstakesId
            },
            status: {
              not: 'REJECTED'
            }
          },
          data: {
            status: 'REJECTED',
            reason: `Participant disqualified: ${disqualificationReason?.trim() || 'No reason provided'}`
          }
        });
      });

      return { success: true };
    }
  );
