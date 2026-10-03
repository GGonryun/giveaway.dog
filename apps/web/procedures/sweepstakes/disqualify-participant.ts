'use server';

import z from 'zod';
import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { findUserSweepstakes } from './shared';
import { TeamPermission } from '@/lib/permissions';
import { TeamTier } from '@prisma/client';

export const disqualifyParticipant = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string(),
      participantId: z.string(),
      disqualificationReason: z.string()
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, input, user }) => {
    const { sweepstakes } = await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found or you do not have access.'
      });
    }

    const participant = await db.sweepstakesParticipant.findFirst({
      where: {
        id: input.participantId,
        sweepstakesId: input.sweepstakesId
      }
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Participant not found in this sweepstakes.'
      });
    }

    await db.$transaction(async (tx) => {
      // Reject all task completions for this participant
      await tx.taskCompletion.updateMany({
        where: {
          participantId: input.participantId,
          task: {
            sweepstakesId: input.sweepstakesId
          },
          status: {
            not: 'REJECTED'
          }
        },
        data: {
          status: 'REJECTED',
          reason: `Participant disqualified: ${input.disqualificationReason?.trim() || 'No reason provided'}`
        }
      });

      // Disqualify all prize draws for this participant's task completions
      await tx.prizeDraw.updateMany({
        where: {
          taskCompletion: {
            participantId: input.participantId,
            task: {
              sweepstakesId: input.sweepstakesId
            }
          },
          result: 'WINNER'
        },
        data: {
          result: 'DISQUALIFIED',
          disqualificationReason: `Participant disqualified: ${input.disqualificationReason?.trim() || 'No reason provided'}`
        }
      });
    });

    return { success: true };
  });
