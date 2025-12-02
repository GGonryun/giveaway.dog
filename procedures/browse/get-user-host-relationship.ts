'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { toTaskSchema } from '@/lib/task/schemas';
import {
  userHostRelationshipSchema,
  userParticipationSchema
} from '@/schemas/giveaway/schemas';

import z from 'zod';

export const getUserHostRelationship = procedure()
  .authorization({ required: false })
  .input(z.object({ id: z.string() }))
  .output(userHostRelationshipSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user) return undefined;

    const profile = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!profile)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'User profile does not exist. Update any of your account settings to continue.'
      });

    // get me all the task completions for this user where the task's sweepstake is associated with the host of the sweepstake being queried
    const taskCompletions = await db.taskCompletion.findMany({
      where: {
        userId: user.id,
        task: {
          sweepstakes: {
            team: {
              sweepstakes: {
                some: {
                  OR: [{ id: input.id }, { visibility: { slug: input.id } }]
                }
              }
            }
          }
        },
        status: {
          in: ['COMPLETED']
        }
      },
      include: {
        task: true
      }
    });

    const loyalty = new Set(taskCompletions.map((c) => c.task.sweepstakesId))
      .size;

    return {
      loyalty
    };
  });
