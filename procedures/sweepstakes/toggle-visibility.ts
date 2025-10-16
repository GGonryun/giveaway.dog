'use server';

import { z } from 'zod';
import { procedure } from '@/lib/mrpc/procedures';
import { VisibilityType } from '@prisma/client';

const toggleVisibilityInput = z.object({
  sweepstakesId: z.string(),
  visibility: z.nativeEnum(VisibilityType)
});

const toggleVisibility = procedure()
  .authorization({ required: true })
  .input(toggleVisibilityInput)
  .output(z.object({ visibility: z.nativeEnum(VisibilityType) }))
  .handler(async ({ db, user, input }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: input.sweepstakesId },
      select: {
        teamId: true,
        team: {
          select: {
            members: {
              where: { userId: user.id },
              select: { id: true }
            }
          }
        }
      }
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new Error('Sweepstakes not found');
    }

    if (sweepstakes.team.members.length === 0) {
      throw new Error('You do not have permission to modify this sweepstakes');
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
