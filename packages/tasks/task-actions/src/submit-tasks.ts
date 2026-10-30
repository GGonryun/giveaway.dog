'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { Prisma } from '@giveaway/db-model';
import type { PrismaClient } from '@giveaway/db-model';
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
import { validateAudience } from '@giveaway/task-validation-core/audience';

const COMPLETION_LOCK_TIMEOUT_MS = 15_000;

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

const alreadyCompleted = () =>
  new ApplicationError({
    code: 'VALIDATION_ERROR',
    silent: true,
    message: 'You have already completed this task. Refresh the page.'
  });

const registerParticipant = async (
  db: PrismaClient,
  userId: string,
  sweepstakesId: string
) => {
  const where = { userId_sweepstakesId: { userId, sweepstakesId } };
  try {
    return await db.sweepstakesParticipant.upsert({
      where,
      update: {},
      create: { userId, sweepstakesId }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return db.sweepstakesParticipant.findUniqueOrThrow({ where });
  }
};

const submitTask = procedure()
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

    await validateAudience(db, { sweepstakesId, userId: user.id });

    const participant = await registerParticipant(db, user.id, sweepstakesId);

    // Check if task has already been completed
    const completions = await db.taskCompletion.findMany({
      where: {
        participantId: participant.id,
        task: { sweepstakesId }
      }
    });

    const existingCompletion = completions.find((c) => c.taskId === taskId);
    if (existingCompletion) {
      throw alreadyCompleted();
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
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT id FROM "Participant" WHERE id = ${participant.id} FOR UPDATE`;
        const recorded = await tx.taskCompletion.findFirst({
          where: { participantId: participant.id, taskId },
          select: { id: true }
        });
        if (recorded) {
          throw alreadyCompleted();
        }
        await tx.taskCompletion.create({
          data: {
            participantId: participant.id,
            taskId,
            status: computeTaskStatus(taskConfig),
            proof: saveTaskProof(taskConfig, data)
          }
        });
      },
      { timeout: COMPLETION_LOCK_TIMEOUT_MS }
    );

    await validateReferral(db, {
      taskId,
      participant,
      completions
    });

    return true;
  });

export default submitTask;
