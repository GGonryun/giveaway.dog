'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { TeamTier } from '@prisma/client';
import { findUserSweepstakes } from './shared';
import { TeamPermission } from '@/lib/permissions';

export const deleteTaskCompletion = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      taskCompletionId: z.string(),
      sweepstakesId: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .invalidate(async ({ input }) => [`sweepstakes-${input.sweepstakesId}`])
  .handler(async ({ db, input, user }) => {
    await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

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

    await db.taskCompletion.delete({
      where: { id: input.taskCompletionId }
    });

    return { success: true };
  });
