'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

import z from 'zod';

import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import {
  TEAM_PARTICIPANT_USER_SELECT_QUERY,
  toTeamParticipant
} from '@giveaway/participant-model/db';

export const getTeamParticipant = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      userId: z.string()
    })
  )
  .output(sweepstakesParticipantSchema)
  .handler(async ({ db, input, user }) => {
    await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const participant = await db.user.findFirst({
      where: {
        id: input.userId,
        participation: {
          some: {
            taskCompletions: {
              some: {
                task: {
                  sweepstakes: {
                    team: {
                      slug: input.slug
                    }
                  }
                }
              }
            }
          }
        }
      },
      select: TEAM_PARTICIPANT_USER_SELECT_QUERY(input)
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`
      });
    }

    return toTeamParticipant(participant);
  });
