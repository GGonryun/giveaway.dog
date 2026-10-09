'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { taskSchema, toTaskSchemaSafe } from '@giveaway/task-model/schemas';

export const getTeamTasks = procedure('participant-server/getTeamTasks')
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(taskSchema.array())
  .handler(async ({ input, db, user }) => {
    const tasks = await db.task.findMany({
      where: {
        sweepstakes: {
          team: {
            slug: input.slug,
            members: {
              some: { userId: user.id }
            }
          }
        }
      }
    });

    return tasks.map(toTaskSchemaSafe);
  });
