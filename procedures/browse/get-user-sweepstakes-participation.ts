'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { toTaskSchema } from '@/lib/task/schemas';
import { userParticipationSchema } from '@/schemas/giveaway/schemas';

import z from 'zod';

const getUserSweepstakesParticipation = procedure()
  .authorization({ required: false })
  .input(z.object({ id: z.string() }))
  .output(userParticipationSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

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
        userId: user.id,
        task: {
          sweepstakes: {
            OR: [{ id: input.id }, { visibility: { slug: input.id } }]
          }
        }
      },
      include: {
        task: true
      }
    });

    return {
      entries: taskCompletions
        .filter((c) => c.status === 'COMPLETED')
        .map((c) => toTaskSchema(c.task))
        .reduce((acc, c) => {
          return acc + c.value;
        }, 0),
      submissions: taskCompletions.map((c) => ({
        taskId: c.taskId,
        status: c.status
      }))
    };
  });

export default getUserSweepstakesParticipation;
