'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import {
  automatedPostJobSchema,
  toAutomatedPostJobSchema
} from '@/lib/automation/schemas';

export const getAutomatedPostJobs = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(automatedPostJobSchema.array())
  .handler(async ({ db, input }) => {
    const jobs = await db.automatedPostJob.findMany({
      where: { sweepstakesId: input.sweepstakesId }
    });

    return jobs.map(toAutomatedPostJobSchema);
  });
