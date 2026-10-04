'use server';

import z from 'zod';

import { procedure } from '@/lib/mrpc/procedures';
import { getSweepstakesCriteria } from '@giveaway/winners-model/criteria';
import { getEligibleCompletions } from '../completions';
import {
  getDrawsInfo,
  getPrizeAllocations
} from '@giveaway/winners-model/slots';
import { toDuplicatePrizeDraw, toUniquePrizeDraw } from '../selection';
import { PrizeDrawResult } from '@prisma/client';
import { ApplicationError } from '@giveaway/util-errors';

export const rerollDraw = procedure()
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
      db,
      user
    }) => {
      const criteria = await getSweepstakesCriteria({
        db,
        sweepstakesId
      });

      const draws = await getDrawsInfo({
        db,
        sweepstakesId
      });

      const completions = await getEligibleCompletions({
        db,
        user,
        sweepstakesId,
        criteria
      });

      const allocations = await getPrizeAllocations({
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
              participantId: true
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

      const toPrizeDraw = criteria.allowMultipleWins
        ? toDuplicatePrizeDraw
        : toUniquePrizeDraw;

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
              sweepstakesId: sweepstakesId
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

        await tx.prizeDraw.createMany({
          data: toPrizeDraw({
            draws,
            slots: [{ prizeId: draw.prizeId }],
            completions,
            criteria,
            allocations
          }).map((d) => ({ ...d, previousDrawId: drawId }))
        });
      });

      return { success: true };
    }
  );
