'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';

import { toJsonObject } from '@giveaway/util-collections/json';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { userEntriesSchema, toTaskSchema } from '@giveaway/task-model/schemas';
import { findTeamSweepstakes } from '@giveaway/sweepstakes-access/team-sweepstakes';

const getSweepstakeTaskEntries = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      taskId: z.string()
    })
  )
  .output(userEntriesSchema.array())
  .handler(async ({ input, user, db }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId: input.sweepstakesId,
      slug: input.slug
    });

    const completions = await db.taskCompletion.findMany({
      where: {
        taskId: input.taskId,
        task: {
          sweepstakesId: sweepstakes.id
        }
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
