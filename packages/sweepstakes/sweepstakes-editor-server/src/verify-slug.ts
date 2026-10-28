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
    const [existing, sweepstakes] = await Promise.all([
      db.sweepstakesVisibility.findFirst({
        where: {
          slug: input.slug
        },
        select: {
          sweepstakesId: true
        }
      }),
      db.sweepstakes.findUnique({
        where: {
          id: input.slug
        },
        select: {
          id: true
        }
      })
    ]);

    const owners = [existing?.sweepstakesId, sweepstakes?.id].filter(
      (owner) => owner !== undefined
    );
    const { currentSweepstakesId } = input;

    return {
      available: owners.every(
        (owner) => !!currentSweepstakesId && owner === currentSweepstakesId
      )
    };
  });

export default verifySlug;
