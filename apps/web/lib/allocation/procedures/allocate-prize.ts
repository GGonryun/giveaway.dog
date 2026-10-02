'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { allocatePrizeRequestSchema } from '@/schemas/giveaway/schemas';
import z from 'zod';

export const allocatePrize = procedure()
  .authorization({ required: true })
  .input(allocatePrizeRequestSchema)
  .output(
    z.object({
      success: z.boolean()
    })
  )
  .handler(async ({ db, user, input }) => {
    await db.sweepstakesAllocation.upsert({
      where: {
        participantId: input.participantId,
        participant: {
          userId: user.id
        }
      },
      create: {
        participantId: input.participantId,
        prizeId: input.prizeId
      },
      update: {
        prizeId: input.prizeId
      }
    });

    return { success: true };
  });
