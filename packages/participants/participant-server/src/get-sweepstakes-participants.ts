'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  listSweepstakesParticipants,
  onlyParticipantsWithCompletions,
  sortParticipantsByMostRecentCompletion
} from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';

export const getSweepstakesParticipants = procedure(
  'participant-server/getSweepstakesParticipants'
)
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string()
    })
  )
  .output(
    z.object({
      users: sweepstakesParticipantSchema.array()
    })
  )
  .handler(async ({ db, input, user }) => {
    const data = {
      ...input,
      userId: user.id
    };

    const participants = await listSweepstakesParticipants({
      db,
      sweepstakesId: data.sweepstakesId
    });

    const processedUsers = participants
      .sort(sortParticipantsByMostRecentCompletion)
      .filter(onlyParticipantsWithCompletions);

    return {
      users: processedUsers
    };
  });
