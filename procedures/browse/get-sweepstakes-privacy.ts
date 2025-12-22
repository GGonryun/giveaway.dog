'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { VisibilityType } from '@prisma/client';
import z from 'zod';

export const getSweepstakesPrivacy = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(z.boolean())
  .handler(async ({ input, db, user }) => {
    // Implement the logic to fetch the sweepstakes visibility
    // For example, you might query the database to get the visibility status
    const sweepstakes = await db.sweepstakes.findFirst({
      where: {
        OR: [
          { id: input.sweepstakesId },
          { visibility: { slug: input.sweepstakesId } }
        ]
      },
      select: {
        teamId: true,
        visibility: {
          select: { visibility: true }
        }
      }
    });

    if (!sweepstakes?.visibility?.visibility) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes visibility is missing'
      });
    }

    // anyone can see public or unlisted sweepstakes
    if (sweepstakes.visibility.visibility !== VisibilityType.PRIVATE) {
      return true;
    }

    if (!sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes teamId is missing'
      });
    }

    if (!user?.id)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User is not authorized to view this sweepstakes'
      });

    const profile = await db.membership.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: sweepstakes.teamId
        }
      },
      select: { id: true }
    });

    if (profile) {
      return true;
    }

    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User is not authorized to view this sweepstakes'
    });
  });
