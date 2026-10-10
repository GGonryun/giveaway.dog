'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { taskSchema, toTaskSchema } from '@giveaway/task-model/schemas';

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
  .handler(async ({ input, db, user }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ],
        team: {
          members: {
            some: { userId: user.id }
          }
        }
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
