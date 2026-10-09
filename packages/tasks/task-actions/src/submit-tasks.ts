'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { validateTask } from '@giveaway/task-validation/integrations';
import { validateMandatoryTasks } from '@giveaway/task-validation-core/mandatory';
import { validateRequiredTasks } from '@giveaway/task-validation-core/required';
import { z } from 'zod';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { computeTaskStatus } from '@giveaway/task-model/status';
import { saveTaskProof } from '@giveaway/task-validation-core/proof';
import { validateReferral } from '@giveaway/task-validation-core/referral';
import { validateSweepstakesState } from '@giveaway/task-validation-core/task-state';

const submitTask = procedure('task-actions/submitTask')
  .authorization({ required: true })
  .input(
    z.object({
      taskId: z.string(),
      sweepstakesId: z.string(),
      data: z.any().optional()
    })
  )
  .output(z.boolean())
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

    validateSweepstakesState(task);

    if (!task.sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giveaway team data is missing. Please contact support.'
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
        silent: true,
        message: 'You have already completed this task. Refresh the page.'
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

    await validateReferral(db, {
      taskId,
      participant,
      completions
    });

    return true;
  });

export default submitTask;
