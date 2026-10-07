'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import { z } from 'zod';

import { toJsonObject } from '@giveaway/util-collections/json';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { userEntriesSchema, toTaskSchema } from '@giveaway/task-model/schemas';

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
  .handler(async ({ input, db, user }) => {
    await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      slug: input.slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const completions = await db.taskCompletion.findMany({
      where: {
        taskId: input.taskId,
        task: {
          sweepstakesId: input.sweepstakesId
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
