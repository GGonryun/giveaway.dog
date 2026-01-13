'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { sweepstakesAllocationSchema } from '@/schemas/giveaway/schemas';
import z from 'zod';

export const getAllocatedPrize = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(sweepstakesAllocationSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) {
      return undefined;
    }

    const { sweepstakesId } = input;

    const allocation = await db.sweepstakesAllocation.findFirst({
      where: {
        participant: {
          userId: user.id,
          sweepstakesId: sweepstakesId
        }
      },
      include: {
        prize: true
      }
    });

    if (!allocation?.prize?.name || !allocation?.prize?.id) {
      return undefined;
    }

    return {
      prize: {
        id: allocation.prize.id,
        name: allocation.prize.name
      }
    };
  });
