'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { taskSchema, toTaskSchema } from '@/lib/task/schemas';

export const getTeamTasks = procedure()
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

    return tasks.map(toTaskSchema);
  });
