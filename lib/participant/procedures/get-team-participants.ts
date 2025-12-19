'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { SWEEPSTAKES_TASK_WHERE_QUERY } from '@/lib/task/queries';

import z from 'zod';

import { sweepstakesParticipantSchema } from '@/lib/participant/schemas';
import {
  TEAM_PARTICIPANT_USER_SELECT_QUERY,
  toTeamParticipant
} from '@/lib/participant/db';

export const getTeamParticipants = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(sweepstakesParticipantSchema.array())
  .handler(async ({ db, input, user }) => {
    const ownedBySweepstakes = SWEEPSTAKES_TASK_WHERE_QUERY({
      slug: input.slug,
      userId: user.id
    });
    const users = await db.user.findMany({
      where: {
        participation: {
          some: {
            taskCompletions: {
              some: {
                task: ownedBySweepstakes
              }
            }
          }
        }
      },
      select: TEAM_PARTICIPANT_USER_SELECT_QUERY(input)
    });

    return users.map(toTeamParticipant);
  });
