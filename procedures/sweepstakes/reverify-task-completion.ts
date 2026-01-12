'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { CompletionStatus } from '@prisma/client';
import { findUserSweepstakesQuery } from './shared';
import { validateTask } from '@/lib/task/validation/integrations';
import { supportsAutomatedReverification } from '@/lib/task/verification/utils';
import { toTaskSchema } from '@/lib/task/schemas';

export const reverifyTaskCompletion = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskCompletionId: z.string(),
      sweepstakesId: z.string()
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      status: z.nativeEnum(CompletionStatus),
      error: z.string().optional()
    })
  )
  .handler(async ({ db, input, user }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.sweepstakesId,
        userId: user.id
      }),
      include: {
        team: true
      }
    });

    if (!sweepstakes?.teamId) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found or you do not have access.'
      });
    }

    const taskCompletion = await db.taskCompletion.findFirst({
      where: {
        id: input.taskCompletionId,
        task: {
          sweepstakesId: input.sweepstakesId
        }
      },
      include: {
        task: true,
        participant: {
          include: {
            user: true
          }
        }
      }
    });

    if (!taskCompletion) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Task completion not found.'
      });
    }

    const taskConfig = toTaskSchema(taskCompletion.task);

    if (!supportsAutomatedReverification(taskConfig.type)) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message:
          'This task does not support automated verification. Please use manual verification.'
      });
    }

    const currentProof = (taskCompletion.proof as any) || {};
    const reverificationHistory = currentProof.reverificationHistory || [];

    try {
      await validateTask(db, {
        task: taskConfig,
        userId: taskCompletion.participant.userId,
        participantId: taskCompletion.participantId,
        teamId: sweepstakes.teamId,
        data: currentProof
      });

      reverificationHistory.push({
        verifiedAt: new Date().toISOString(),
        success: true,
        status: 'COMPLETED'
      });

      await db.taskCompletion.update({
        where: { id: input.taskCompletionId },
        data: {
          status: CompletionStatus.COMPLETED,
          proof: {
            ...currentProof,
            reverificationHistory
          }
        }
      });

      return {
        success: true,
        status: CompletionStatus.COMPLETED
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Verification failed';

      reverificationHistory.push({
        verifiedAt: new Date().toISOString(),
        success: false,
        status: 'REJECTED',
        error: errorMessage
      });

      await db.taskCompletion.update({
        where: { id: input.taskCompletionId },
        data: {
          status: CompletionStatus.REJECTED,
          proof: {
            ...currentProof,
            reverificationHistory,
            lastVerificationError: errorMessage
          }
        }
      });

      return {
        success: false,
        status: CompletionStatus.REJECTED,
        error: errorMessage
      };
    }
  });
