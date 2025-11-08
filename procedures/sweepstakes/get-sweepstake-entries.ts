'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';

import { userEntriesSchema } from '@/schemas/tasks/schemas';
import { toTaskSchema } from '@/schemas/tasks/parse';
import { toJsonObject } from '@/lib/json';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';

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
        user: {
          select: USER_SCHEMA_SELECT_QUERY
        },
        task: true
      }
    });

    return completions.map((c) => {
      return {
        ...c,
        user: toUserSchema(c.user),
        completedAt: c.completedAt.getTime(),
        proof: toJsonObject(c.proof),
        task: toTaskSchema(c.task)
      };
    });
  });

export default getSweepstakeEntries;
