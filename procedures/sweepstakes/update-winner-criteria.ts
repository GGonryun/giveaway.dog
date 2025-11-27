'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import {
  allowedUserSourcesSchema,
  parseUserSourceSchema
} from '@/lib/user-source/schemas';

const updateWinnerCriteriaInput = z.object({
  sweepstakesId: z.string(),
  slug: z.string(),
  minTasksCompleted: z.number().int().min(1),
  minQualityScore: z.number().int().min(0).max(100),
  allowMultipleWins: z.boolean(),
  externalPlatforms: allowedUserSourcesSchema.nullable().optional()
});

const updateWinnerCriteria = procedure()
  .authorization({ required: true })
  .input(updateWinnerCriteriaInput)
  .output(
    z.object({
      minTasksCompleted: z.number(),
      minQualityScore: z.number(),
      allowMultipleWins: z.boolean(),
      externalPlatforms: allowedUserSourcesSchema.nullable().optional()
    })
  )
  .handler(async ({ db, user, input }) => {
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        id: input.sweepstakesId,
        team: {
          slug: input.slug,
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        team: true
      }
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this sweepstakes'
      });
    }

    const updated = await db.sweepstakesWinnerCriteria.update({
      where: {
        sweepstakesId: input.sweepstakesId
      },
      data: {
        minTasksCompleted: input.minTasksCompleted,
        minQualityScore: input.minQualityScore,
        allowMultipleWins: input.allowMultipleWins,
        externalPlatforms: input.externalPlatforms || []
      }
    });

    return {
      minTasksCompleted: updated.minTasksCompleted ?? 1,
      minQualityScore: updated.minQualityScore ?? 70,
      allowMultipleWins: updated.allowMultipleWins ?? false,
      externalPlatforms: parseUserSourceSchema(updated.externalPlatforms)
    };
  });

export default updateWinnerCriteria;
