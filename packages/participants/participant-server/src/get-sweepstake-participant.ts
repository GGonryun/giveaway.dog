'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';

import z from 'zod';
import { findSweepstakesParticipant } from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';

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
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId: input.sweepstakesId,
      slug: input.slug
    });

    const participant = await findSweepstakesParticipant({
      db,
      userId: input.userId,
      sweepstakesId: sweepstakes.id
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
