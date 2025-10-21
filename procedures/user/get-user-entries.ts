import { procedure } from '@/lib/mrpc/procedures';
import { taskCompletionSchema } from '@/schemas/giveaway/participant';
import {
  TASK_COMPLETION_INCLUDE_QUERY,
  toTaskCompletion
} from '@/schemas/participants';
import z from 'zod';

const getUserEntries = procedure()
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
        userId: input.userId,
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
      include: TASK_COMPLETION_INCLUDE_QUERY
    });

    return tasks.map(toTaskCompletion);
  });

export default getUserEntries;
