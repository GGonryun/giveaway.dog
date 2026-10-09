'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { saveTaskProof } from '@giveaway/task-validation-core/proof';
import { validateSweepstakesState } from '@giveaway/task-validation-core/task-state';

const updateTask = procedure('task-actions/updateTask')
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
      `User ${user.id} is updating task ${taskId} for sweepstakes ${sweepstakesId}`
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

    if (completions.length === 0) {
      throw new ApplicationError({
        code: 'CONFLICT',
        silent: true,
        message: 'You have not completed this task yet.'
      });
    }

    if (completions.length > 1) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Multiple completions found for this task. Please contact support.',
        cause:
          'Users cannot modify multiple completions of the same task with this procedure.'
      });
    }

    const existingCompletion = completions.find((c) => c.taskId === taskId);
    if (!existingCompletion) {
      throw new ApplicationError({
        code: 'CONFLICT',
        silent: true,
        message: 'You have not completed this task yet.'
      });
    }

    const taskConfig = toTaskSchema(task);

    console.info(
      `Recording completion of task ${taskId} for user ${participant.userId}`
    );
    await db.taskCompletion.update({
      where: {
        id: existingCompletion.id
      },
      data: {
        proof: saveTaskProof(taskConfig, data)
      }
    });

    return true;
  });

export default updateTask;
