'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { validateTask } from '@/lib/task/validation/integrations';
import { validateMandatoryTasks } from '@/lib/task/validation/mandatory';
import { toTaskSchema } from '@/schemas/tasks/parse';
import { CompletionStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const submitTask = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskId: z.string(),
      sweepstakesId: z.string()
    })
  )
  .output(
    z.object({
      sweepstakesId: z.string(),
      sweepstakesSlug: z.string().nullable().optional()
    })
  )
  .handler(async ({ db, user, input: { taskId, sweepstakesId } }) => {
    const tasks = await db.task.findMany({
      where: {
        sweepstakesId: sweepstakesId
      },
      include: {
        sweepstakes: {
          include: {
            timing: true,
            visibility: true
          }
        }
      }
    });

    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
      });
    }

    if (!task.sweepstakes.timing) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giveaway timing data is missing. Please contact support.'
      });
    }

    if (
      !task.sweepstakes.timing.startDate ||
      !task.sweepstakes.timing.endDate
    ) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giveaway timing data is incomplete. Please contact support.'
      });
    }

    const now = new Date();
    const startDate = new Date(task.sweepstakes.timing.startDate);
    const endDate = new Date(task.sweepstakes.timing.endDate);

    if (task.sweepstakes.status !== 'ACTIVE') {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway is no longer accepting entries.'
      });
    }

    if (now < startDate) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway has not started yet.'
      });
    }

    if (now > endDate) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway has ended and is no longer accepting entries.'
      });
    }

    // Check if task has already been completed
    const completions = await db.taskCompletion.findMany({
      where: {
        userId: user.id,
        task: { sweepstakesId }
      }
    });

    const existingCompletion = completions.find((c) => c.taskId === taskId);
    if (existingCompletion) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'You have already completed this task.'
      });
    }

    await validateMandatoryTasks({
      taskId,
      tasks,
      completions
    });

    await validateTask(db, {
      task: toTaskSchema(task),
      userId: user.id
    });

    await db.taskCompletion.create({
      data: {
        userId: user.id,
        taskId,
        status: CompletionStatus.COMPLETED
      }
    });

    return {
      sweepstakesId: task.sweepstakes.id,
      sweepstakesSlug: task.sweepstakes.visibility?.slug
    };
  });

export default submitTask;
