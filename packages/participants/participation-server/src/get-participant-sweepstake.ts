'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { participantSweepstakeSchema } from '@giveaway/sweepstakes-model/schemas';
import { findParticipantSweepstake } from './participant-sweepstake';

const getParticipantSweepstake = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(participantSweepstakeSchema)
  .cache(({ input }) => ({
    keyParts: [`participant-sweepstake-v2-${input.sweepstakesId}`],
    tags: [`sweepstakes-${input.sweepstakesId}`, 'participant-sweepstake'],
    revalidate: 600 // Cache for 10 minutes
  }))
  .handler(({ input, db }) =>
    findParticipantSweepstake({
      db,
      sweepstakesId: input.sweepstakesId,
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      }
    })
  );

export default getParticipantSweepstake;
