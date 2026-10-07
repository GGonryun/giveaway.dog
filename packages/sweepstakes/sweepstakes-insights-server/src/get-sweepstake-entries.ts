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

const getSweepstakeEntries = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(userEntriesSchema.array())
  .handler(async ({ input: { sweepstakesId, slug }, db, user }) => {
    const { sweepstakes } = await findUserSweepstakes({
      db,
      user,
      id: sweepstakesId,
      slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const completions = await db.taskCompletion.findMany({
      where: {
        task: {
          sweepstakesId: sweepstakes.id
        }
      },
      include: {
        participant: {
          include: {
            user: {
              select: USER_SCHEMA_SELECT_QUERY
            }
          }
        },
        task: true
      }
    });

    const entries = completions.map((c) => {
      return {
        ...c,
        user: toUserSchema(c.participant.user),
        completedAt: c.completedAt.getTime(),
        proof: toJsonObject(c.proof),
        task: toTaskSchema(c.task)
      };
    });

    return entries.sort((a, b) => b.completedAt - a.completedAt);
  });

export default getSweepstakeEntries;
