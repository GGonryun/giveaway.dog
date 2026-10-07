'use server';

import z from 'zod';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import {
  listSweepstakesParticipants,
  onlyParticipantsWithCompletions,
  sortParticipantsByMostRecentCompletion
} from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';

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
    await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      slug: input.slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const participants = await listSweepstakesParticipants({
      db,
      sweepstakesId: input.sweepstakesId
    });

    const processedUsers = participants
      .sort(sortParticipantsByMostRecentCompletion)
      .filter(onlyParticipantsWithCompletions);

    return {
      users: processedUsers
    };
  });
