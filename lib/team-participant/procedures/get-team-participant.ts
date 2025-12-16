'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';

import z from 'zod';

import { sweepstakesParticipantSchema } from '@/lib/participant/schemas';
import {
  TEAM_PARTICIPANT_USER_SELECT_QUERY,
  toTeamParticipant
} from '@/lib/participant/db';
import { TASK_COMPLETIONS_SELECT_QUERY } from '@/lib/task/completions';

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
  .handler(async ({ db, input }) => {
    const user = await db.user.findFirst({
      where: {
        id: input.userId
      },
      select: TEAM_PARTICIPANT_USER_SELECT_QUERY(input)
    });

    if (!user) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`
      });
    }

    return toTeamParticipant(user);
  });
