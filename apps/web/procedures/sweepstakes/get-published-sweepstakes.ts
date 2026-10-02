'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

export const getPublishedSweepstakes = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(z.object({ count: z.number() }))
  .handler(async ({ input: { slug }, db }) => {
    const team = await db.team.findUnique({
      where: {
        slug
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Team with slug ${slug} not found`
      });
    }

    const count = await db.sweepstakes.count({
      where: {
        teamId: team.id,
        status: {
          in: ['COMPLETED', 'ACTIVE']
        }
      }
    });

    return { count };
  });
