'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { taskSchema, toTaskSchema } from '@/lib/task/schemas';

export const getSweepstakesTasks = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(taskSchema.array())
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      include: {
        team: true,
        tasks: true
      }
    });
    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    return sweepstakes.tasks.map(toTaskSchema);
  });
