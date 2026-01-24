'use server';

import { z } from 'zod';
import { procedure } from '@/lib/mrpc/procedures';
import { VisibilityType } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';
import { PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { findUserSweepstakes } from './shared';
import { TeamPermission } from '@/lib/permissions';

const toggleVisibilityInput = z.object({
  sweepstakesId: z.string(),
  visibility: z.nativeEnum(VisibilityType)
});

const toggleVisibility = procedure()
  .authorization({ required: true })
  .input(toggleVisibilityInput)
  .output(z.object({ visibility: z.nativeEnum(VisibilityType) }))
  .invalidate(async ({ input }) => [
    `sweepstakes-${input.sweepstakesId}`,
    `sweepstakes-${input.sweepstakesId}-privacy` // Invalidate privacy cache when visibility changes
  ])
  .handler(async ({ db, user, input }) => {
    const { sweepstakes } = await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId,
      permission: TeamPermission.UPDATE_SWEEPSTAKES
    });

    // Check if user is trying to set visibility to PUBLIC
    if (input.visibility === VisibilityType.PUBLIC) {
      if (!sweepstakes.teamId) {
        throw new ApplicationError({
          code: 'FORBIDDEN',
          message:
            'Sweepstakes must belong to a team to be made public. Please contact support at /support for assistance.'
        });
      }

      const hasPublicSweepstakesFlag = await db.teamFeatureFlag.findUnique({
        where: {
          key_teamId: {
            key: PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY,
            teamId: sweepstakes.teamId
          }
        }
      });

      if (!hasPublicSweepstakesFlag) {
        throw new ApplicationError({
          code: 'FORBIDDEN',
          message:
            'Your team does not have permission to make sweepstakes public. Please contact support at /support to enable this feature for your team.'
        });
      }
    }

    const existing = await db.sweepstakesVisibility.findUnique({
      where: { sweepstakesId: input.sweepstakesId }
    });

    if (existing) {
      await db.sweepstakesVisibility.update({
        where: { sweepstakesId: input.sweepstakesId },
        data: {
          visibility: input.visibility
        }
      });
    } else {
      await db.sweepstakesVisibility.create({
        data: {
          sweepstakesId: input.sweepstakesId,
          visibility: input.visibility
        }
      });
    }

    return { visibility: input.visibility };
  });

export default toggleVisibility;
