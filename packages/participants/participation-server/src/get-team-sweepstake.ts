'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { participantSweepstakeSchema } from '@giveaway/sweepstakes-model/schemas';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';
import { findParticipantSweepstake } from './participant-sweepstake';

const getTeamSweepstake = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(participantSweepstakeSchema)
  .handler(async ({ input: { sweepstakesId, slug }, user, db }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId,
      slug
    });

    return findParticipantSweepstake({
      db,
      sweepstakesId,
      where: { id: sweepstakes.id }
    });
  });

export default getTeamSweepstake;
