import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { userParticipationSchema } from '@/schemas/giveaway/schemas';
import { toTaskSchema } from '@/schemas/tasks/parse';
import { minutesToSeconds } from 'date-fns';
import z from 'zod';

const getUserSweepstakesParticipation = procedure
  .authorization({ required: false })
  .input(z.object({ id: z.string() }))
  .cache(({ user, input }) => {
    return {
      tags: [`sweepstakes-${input.id}-user-${user.id}-participation`],
      revalidate: minutesToSeconds(1)
    };
  })
  .output(userParticipationSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user) return undefined;

    const profile = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!profile)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'User profile does not exist. Update any of your account settings to continue.'
      });

    const taskCompletions = await db.taskCompletion.findMany({
      where: {
        task: {
          sweepstakesId: input.id
        },
        status: {
          in: ['COMPLETED']
        }
      },
      include: {
        task: true
      }
    });

    const entries = taskCompletions
      .map((c) => toTaskSchema(c.task))
      .reduce((acc, c) => {
        return acc + c.value;
      }, 0);

    const completedTasks = taskCompletions.map((t) => t.taskId);
    const out = {
      entries,
      completedTasks
    };
    console.log('refreshing user sweepstakes participation', out);
    return out;
  });

export default getUserSweepstakesParticipation;
