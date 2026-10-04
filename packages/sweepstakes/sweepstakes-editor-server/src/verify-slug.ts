'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';

export const verifySlug = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string().min(1),
      currentSweepstakesId: z.string().optional()
    })
  )
  .output(
    z.object({
      available: z.boolean()
    })
  )
  .handler(async ({ db, input }) => {
    const existing = await db.sweepstakesVisibility.findFirst({
      where: {
        slug: input.slug
      },
      select: {
        sweepstakesId: true
      }
    });

    if (!existing) {
      return { available: true };
    }

    if (
      input.currentSweepstakesId &&
      existing.sweepstakesId === input.currentSweepstakesId
    ) {
      return { available: true };
    }

    return { available: false };
  });

export default verifySlug;
