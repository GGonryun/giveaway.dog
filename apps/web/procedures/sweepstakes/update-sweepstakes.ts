'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { applySweepstakesChanges } from './shared';
import z from 'zod';
import { sweepstakesInputSchema } from '@/schemas/giveaway/db';

const updateSweepstakes = procedure()
  .authorization({ required: true })
  .input(sweepstakesInputSchema)
  .output(z.object({ slug: z.string() }))
  .invalidate(async ({ input }) => [`sweepstakes-${input.id}`])
  .handler(async ({ db, user, input }) => {
    const { team } = await applySweepstakesChanges({
      db,
      user,
      input
    });

    return { slug: team.slug };
  });

export default updateSweepstakes;
