'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

import { toJsonObject } from '@giveaway/util-collections/json';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { userEntriesSchema, toTaskSchema } from '@/lib/task/schemas';

const getSweepstakeEntries = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(userEntriesSchema.array())
  .handler(async ({ input: { sweepstakesId, slug }, db }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: sweepstakesId,
        team: {
          slug: slug
        }
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${sweepstakesId} not found`
      });
    }

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
