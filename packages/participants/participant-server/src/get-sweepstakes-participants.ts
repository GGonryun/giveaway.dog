'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  listSweepstakesParticipants,
  onlyParticipantsWithCompletions,
  sortParticipantsByMostRecentCompletion
} from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';

export const getSweepstakesParticipants = procedure()
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
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId: input.sweepstakesId,
      slug: input.slug
    });

    const participants = await listSweepstakesParticipants({
      db,
      sweepstakesId: sweepstakes.id
    });

    const processedUsers = participants
      .sort(sortParticipantsByMostRecentCompletion)
      .filter(onlyParticipantsWithCompletions);

    return {
      users: processedUsers
    };
  });
