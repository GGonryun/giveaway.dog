'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

import { toJsonObject } from '@giveaway/util-collections/json';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { userEntriesSchema, toTaskSchema } from '@giveaway/task-model/schemas';

const getSweepstakeTaskEntries = procedure(
  'sweepstakes-insights-server/getSweepstakeTaskEntries'
)
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      taskId: z.string()
    })
  )
  .output(userEntriesSchema.array())
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
        participant: {
          select: {
            user: { select: USER_SCHEMA_SELECT_QUERY }
          }
        },
        task: true
      }
    });

    return completions.map((completion) => ({
      ...completion,
      user: toUserSchema(completion.participant.user),
      completedAt: completion.completedAt.getTime(),
      proof: toJsonObject(completion.proof),
      task: toTaskSchema(completion.task)
    }));
  });

export default getSweepstakeTaskEntries;
