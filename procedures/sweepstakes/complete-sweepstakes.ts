'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';

const completeSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .invalidate(async ({ input }) => [
    `sweepstakes-list-${input.slug}`,
    `sweepstakes-${input.sweepstakesId}`
  ])
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
            winners: true
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
      (sum, prize) => sum + prize.winners.length,
      0
    );

    if (selectedWinners < totalSlots) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Cannot complete sweepstakes: not all winners have been selected'
      });
    }

    await db.sweepstakes.update({
      where: {
        id: input.sweepstakesId
      },
      data: {
        status: 'COMPLETED'
      }
    });

    return { success: true };
  });

export default completeSweepstakes;
