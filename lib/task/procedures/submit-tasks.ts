'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { validateTask } from '@/lib/task/validation/integrations';
import { validateMandatoryTasks } from '@/lib/task/validation/mandatory';
import { validateRequiredTasks } from '@/lib/task/validation/required';
import { z } from 'zod';
import { toTaskSchema } from '../schemas';
import { computeTaskStatus } from '../validation/status';
import { saveTaskProof } from '../validation/proof';

const submitTask = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskId: z.string(),
      sweepstakesId: z.string(),
      data: z.any().optional()
    })
  )
  .output(
    z.object({
      sweepstakesId: z.string(),
      sweepstakesSlug: z.string().nullable().optional()
    })
  )
  .handler(async ({ db, user, input: { data, taskId, sweepstakesId } }) => {
    console.info(
      `User ${user.id} is submitting task ${taskId} for sweepstakes ${sweepstakesId}`
    );
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

    if (!task.sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giveaway team data is missing. Please contact support.'
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

    // Check if giveaway is in a valid state for accepting entries
    if (task.sweepstakes.status === 'DRAFT') {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway has not been published yet.'
      });
    }

    if (task.sweepstakes.status === 'COMPLETED') {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway is no longer accepting entries.'
      });
    }

    const now = new Date();
    const startDate = new Date(task.sweepstakes.timing.startDate);
    const endDate = new Date(task.sweepstakes.timing.endDate);

    // Check if giveaway has started
    if (now < startDate) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway has not started yet.'
      });
    }

    // Check if giveaway has ended
    if (now > endDate) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'This giveaway has ended and is no longer accepting entries.'
      });
    }

    const participant = await db.sweepstakesParticipant.upsert({
      where: {
        userId_sweepstakesId: {
          userId: user.id,
          sweepstakesId: sweepstakesId
        }
      },
      update: {},
      create: {
        userId: user.id,
        sweepstakesId: sweepstakesId
      }
    });

    // Check if task has already been completed
    const completions = await db.taskCompletion.findMany({
      where: {
        participantId: participant.id,
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

    const taskConfig = toTaskSchema(task);

    console.info(
      `Validating mandatory and required tasks for user ${participant.userId} on task ${taskId}`
    );
    await validateMandatoryTasks({
      taskId,
      tasks,
      completions
    });

    console.info(
      `Validating required tasks ${taskId} for user ${participant.userId}`
    );
    await validateRequiredTasks({
      taskId,
      tasks,
      completions
    });

    console.info(`Validating task ${taskId} for user ${participant.userId}`);
    await validateTask(db, {
      task: taskConfig,
      userId: participant.userId,
      participantId: participant.id,
      teamId: task.sweepstakes.teamId,
      data
    });

    console.info(
      `Recording completion of task ${taskId} for user ${participant.userId}`
    );
    await db.taskCompletion.create({
      data: {
        participantId: participant.id,
        taskId,
        status: computeTaskStatus(taskConfig),
        proof: saveTaskProof(taskConfig, data)
      }
    });

    return {
      sweepstakesId: task.sweepstakes.id,
      sweepstakesSlug: task.sweepstakes.visibility?.slug
    };
  });

export default submitTask;
