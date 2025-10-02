'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { CompletionStatus } from '@prisma/client';
import { z } from 'zod';

const submitTask = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskId: z.string()
    })
  )
  .output(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .invalidate(async ({ output, user }) => [
    `sweepstakes-${output.sweepstakesId}-user-${user.id}-participation`
  ])
  .handler(async ({ db, user, input }) => {
    const task = await db.task.findUnique({
      where: {
        id: input.taskId
      }
    });

    if (!task) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
      });
    }

    // TODO: perform additional validation.
    await db.taskCompletion.create({
      data: {
        userId: user.id,
        taskId: input.taskId,
        status: CompletionStatus.COMPLETED
      }
    });

    return task;
  });

export default submitTask;
