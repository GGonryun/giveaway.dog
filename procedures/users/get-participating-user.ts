'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { sweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import {
  SWEEPSTAKES_TASK_WHERE_QUERY,
  toUserParticipationSchema,
  USER_PARTICIPATION_INCLUDE_QUERY
} from '@/schemas/participants';
import z from 'zod';

const getParticipatingUser = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string().optional(),
      userId: z.string()
    })
  )
  .output(sweepstakesParticipantSchema)
  .handler(async ({ db, input, user }) => {
    const totalTasks = await db.task.count({
      where: SWEEPSTAKES_TASK_WHERE_QUERY({
        ...input,
        userId: user.id
      })
    });

    const participant = await db.user.findFirst({
      where: {
        id: input.userId
      },
      include: USER_PARTICIPATION_INCLUDE_QUERY(input.sweepstakesId)
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`
      });
    }

    return toUserParticipationSchema(participant, totalTasks);
  });

export default getParticipatingUser;
