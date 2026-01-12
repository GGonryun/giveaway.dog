'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { CompletionStatus } from '@prisma/client';
import { findUserSweepstakesQuery } from './shared';

export const updateTaskCompletionStatus = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskCompletionId: z.string(),
      sweepstakesId: z.string(),
      status: z.nativeEnum(CompletionStatus),
      reason: z.string().optional()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, input, user }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.sweepstakesId,
        userId: user.id
      })
    });

    if (!sweepstakes) {
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
      }
    });

    if (!taskCompletion) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Task completion not found.'
      });
    }

    const currentProof = (taskCompletion.proof as any) || {};
    const verificationHistory = currentProof.verificationHistory || [];

    verificationHistory.push({
      status: input.status,
      verifiedAt: new Date().toISOString(),
      reason: input.reason || null
    });

    await db.$transaction(async (tx) => {
      // Update the task completion status
      await tx.taskCompletion.update({
        where: { id: input.taskCompletionId },
        data: {
          status: input.status,
          reason:
            input.status === CompletionStatus.COMPLETED
              ? null
              : input.reason || null,
          proof: {
            ...currentProof,
            verificationHistory
          }
        }
      });

      // If rejecting the entry, disqualify any prize draws associated with it
      if (input.status === CompletionStatus.REJECTED) {
        await tx.prizeDraw.updateMany({
          where: {
            taskCompletionId: input.taskCompletionId,
            result: 'WINNER'
          },
          data: {
            result: 'DISQUALIFIED',
            disqualificationReason: `Entry rejected: ${input.reason?.trim() || 'No reason provided'}`
          }
        });
      }
    });

    return { success: true };
  });
