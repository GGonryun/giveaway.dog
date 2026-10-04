'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import {
  allowedUserSourcesSchema,
  parseUserSourceSchema
} from '@giveaway/user-source-model/schemas';
import { Prisma, TeamTier } from '@prisma/client';
import { sweepstakesWinnerCriteriaSchema } from '@/schemas/giveaway/schemas';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION
} from '@/schemas/giveaway/defaults';
import { findUserSweepstakes } from './shared';
import { TeamPermission } from '@/lib/permissions';

const updateWinnerCriteriaInput = z.object({
  sweepstakesId: z.string(),
  slug: z.string(),
  minTasksCompleted: z.number().int().min(1),
  minQualityScore: z.number().int().min(0).max(100),
  allowMultipleWins: z.boolean(),
  allowUserSelection: z.boolean(),
  externalPlatforms: allowedUserSourcesSchema.nullable().optional()
});

const updateWinnerCriteria = procedure()
  .authorization({ required: true })
  .input(updateWinnerCriteriaInput)
  .output(sweepstakesWinnerCriteriaSchema)
  .handler(async ({ db, user, input }) => {
    await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const updated = await db.sweepstakesWinnerCriteria.update({
      where: {
        sweepstakesId: input.sweepstakesId
      },
      data: {
        minTasksCompleted: input.minTasksCompleted,
        minQualityScore: input.minQualityScore,
        allowMultipleWins: input.allowMultipleWins,
        allowUserSelection: input.allowUserSelection,
        externalPlatforms: input.externalPlatforms || Prisma.JsonNull
      }
    });

    return {
      minTasksCompleted: updated.minTasksCompleted ?? 1,
      minQualityScore: updated.minQualityScore ?? 50,
      allowMultipleWins:
        updated.allowMultipleWins ?? DEFAULT_ALLOW_MULTIPLE_WINS,
      allowUserSelection:
        updated.allowUserSelection ?? DEFAULT_ALLOW_USER_SELECTION,
      externalPlatforms: parseUserSourceSchema(updated.externalPlatforms)
    };
  });

export default updateWinnerCriteria;
