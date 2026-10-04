import 'server-only';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  TASK_COMPLETIONS_SELECT_QUERY,
  taskCompletionSchema,
  toTaskCompletion
} from '@giveaway/task-model/completions';

import z from 'zod';

export const getTaskCompletions = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      userId: z.string()
    })
  )
  .output(taskCompletionSchema.array())
  .handler(async ({ input, db, user }) => {
    const tasks = await db.taskCompletion.findMany({
      where: {
        participant: {
          user: { id: input.userId }
        },
        task: {
          sweepstakes: {
            team: {
              members: {
                some: { userId: user.id }
              }
            }
          }
        }
      },
      select: TASK_COMPLETIONS_SELECT_QUERY
    });

    return tasks.map(toTaskCompletion);
  });
