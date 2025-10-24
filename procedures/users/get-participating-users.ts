'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { sweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

import {
  SWEEPSTAKES_TASK_WHERE_QUERY,
  toUserParticipationSchema,
  USER_PARTICIPATION_INCLUDE_QUERY
} from '@/schemas/participants';
import z from 'zod';

const getParticipatingUsers = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      sweepstakesId: z.string().optional()
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
    const ownedBySweepstakes = SWEEPSTAKES_TASK_WHERE_QUERY(data);
    const sweepstakesInclude = USER_PARTICIPATION_INCLUDE_QUERY(data);

    const totalTasks = await db.task.count({
      where: ownedBySweepstakes
    });

    const participants = await db.user.findMany({
      where: {
        taskCompletions: {
          some: {
            task: ownedBySweepstakes
          }
        }
      },
      include: sweepstakesInclude
    });

    const processedUsers = participants.map((user) =>
      toUserParticipationSchema(user, totalTasks)
    );

    return {
      users: processedUsers
    };
  });

export default getParticipatingUsers;
