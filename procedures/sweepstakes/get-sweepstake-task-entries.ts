'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';

import { toTaskSchema } from '@/schemas/tasks/parse';
import { toJsonObject } from '@/lib/json';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';
import { taskCompletionSchema } from '@/schemas/tasks/schemas';

const getSweepstakeTaskEntries = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      taskId: z.string()
    })
  )
  .output(taskCompletionSchema.array())
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.sweepstakesId
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.sweepstakesId} not found`
      });
    }

    const completions = await db.taskCompletion.findMany({
      where: {
        taskId: input.taskId
      },
      include: {
        user: {
          select: USER_SCHEMA_SELECT_QUERY
        },
        task: true
      }
    });

    return completions.map((completion) => ({
      ...completion,
      user: toUserSchema(completion.user),
      completedAt: completion.completedAt.getTime(),
      proof: toJsonObject(completion.proof),
      task: toTaskSchema(completion.task)
    }));
  });

export default getSweepstakeTaskEntries;
