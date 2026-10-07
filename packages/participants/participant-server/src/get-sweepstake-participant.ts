'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

import z from 'zod';
import { findSweepstakesParticipant } from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';

export const getSweepstakesParticipant = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string(),
      userId: z.string()
    })
  )
  .output(sweepstakesParticipantSchema)
  .handler(async ({ db, input, user }) => {
    await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      slug: input.slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const participant = await findSweepstakesParticipant({
      db,
      userId: input.userId,
      sweepstakesId: input.sweepstakesId
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User not found`,
        data: { userId: input.userId }
      });
    }

    return participant;
  });
