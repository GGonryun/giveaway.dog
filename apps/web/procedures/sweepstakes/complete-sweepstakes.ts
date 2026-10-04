'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';
import {
  PrizeDrawResult,
  SweepstakesJobStatus,
  SweepstakesJobType
} from '@prisma/client';

const completeSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, user, input }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.sweepstakesId,
        team: {
          slug: input.slug,
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        prizes: {
          include: {
            draws: {
              where: {
                result: PrizeDrawResult.WINNER
              }
            }
          }
        }
      }
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    const totalSlots = sweepstakes.prizes.reduce(
      (sum, prize) => sum + (prize.quota ?? 0),
      0
    );
    const selectedWinners = sweepstakes.prizes.reduce(
      (sum, prize) => sum + prize.draws.length,
      0
    );

    if (selectedWinners < totalSlots) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message:
          'Cannot complete sweepstakes: not all winners have been selected'
      });
    }

    await db.$transaction(async (tx) => {
      await tx.sweepstakes.update({
        where: {
          id: input.sweepstakesId
        },
        data: {
          status: 'COMPLETED'
        }
      });

      await tx.sweepstakesJob.upsert({
        where: {
          sweepstakesId_type: {
            sweepstakesId: sweepstakes.id,
            type: SweepstakesJobType.PROCESS_COMPLETION
          }
        },
        update: {
          runAt: new Date()
        },
        create: {
          sweepstakesId: sweepstakes.id,
          type: SweepstakesJobType.PROCESS_COMPLETION,
          status: SweepstakesJobStatus.PENDING,
          runAt: new Date()
        }
      });
    });

    return { success: true };
  });

export default completeSweepstakes;
