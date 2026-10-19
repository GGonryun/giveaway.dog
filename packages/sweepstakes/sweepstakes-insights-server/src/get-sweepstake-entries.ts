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
  .handler(async ({ input: { sweepstakesId, slug }, user, db }) => {
    const sweepstakes = await findTeamSweepstakes({
      db,
      userId: user.id,
      sweepstakesId,
      slug
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
