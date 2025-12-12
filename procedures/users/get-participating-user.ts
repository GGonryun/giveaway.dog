'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { SWEEPSTAKES_TASK_WHERE_QUERY } from '@/lib/task/queries';
import { sweepstakesParticipantSchema_old } from '@/schemas/giveaway/participant';
import {
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
  .output(sweepstakesParticipantSchema_old)
  .handler(async ({ db, input, user }) => {
    const query = {
      ...input,
      userId: user.id
    };

    const totalTasks = await db.task.count({
      where: SWEEPSTAKES_TASK_WHERE_QUERY(query)
    });

    const participant = await db.user.findFirst({
      where: {
        id: input.userId
      },
      include: USER_PARTICIPATION_INCLUDE_QUERY(query)
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
