'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';

import { DEFAULT_PAGE_SIZE } from '@/lib/settings';
import { taskCompletionSchema } from '@/schemas/tasks/schemas';
import { toTaskSchema } from '@/schemas/tasks/parse';
import { toJsonObject } from '@/lib/json';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';

const getSweepstakeEntries = procedure
  .authorization({
    required: false
  })
  .input(
    z.object({
      id: z.string(),
      page: z.number().optional()
    })
  )
  .cache({ revalidate: 60 })
  .output(taskCompletionSchema.array())
  .handler(async ({ input, db }) => {
    const page = input.page || 1;
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.id
      },
      include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    const completions = await db.taskCompletion.findMany({
      where: {
        task: {
          sweepstakesId: input.id
        }
      },
      include: {
        user: {
          select: USER_SCHEMA_SELECT_QUERY
        },
        task: true
      },
      skip: (page - 1) * 20,
      take: DEFAULT_PAGE_SIZE
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
