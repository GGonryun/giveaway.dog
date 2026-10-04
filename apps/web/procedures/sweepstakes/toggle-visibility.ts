'use server';

import { z } from 'zod';
import { procedure } from '@giveaway/rpc-server/procedures';
import { TeamTier, VisibilityType } from '@prisma/client';
import { ApplicationError } from '@giveaway/util-errors';
import { findUserSweepstakes } from './shared';
import { TeamPermission } from '@giveaway/team-permissions';

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
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
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
