'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';
import {
  automatedPostJobSchema,
  toAutomatedPostJobSchema
} from '@giveaway/automation-model/schemas';

export const getAutomatedPostJobs = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(automatedPostJobSchema.array())
  .handler(async ({ db, input, user }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId: input.sweepstakesId,
      slug: input.slug
    });

    const jobs = await db.automatedPostJob.findMany({
      where: { sweepstakesId: sweepstakes.id }
    });

    return jobs.map(toAutomatedPostJobSchema);
  });
