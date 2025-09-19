'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { Prisma, SweepstakesStatus } from '@prisma/client';
import {
  formatDistance,
  formatDistanceToNow,
  isAfter,
  minutesToSeconds
} from 'date-fns';
import {
  sweepstakesDataSchema,
  listSweepstakesFiltersSchema
} from '@/schemas/sweepstakes';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

const getSweepstakesList = procedure
  .authorization({ required: true })
  .input(
    listSweepstakesFiltersSchema.extend({
      slug: z.string()
    })
  )
  .output(sweepstakesDataSchema.array())
  .cache(({ user, input }) => {
    return {
      tags: [
        'sweepstakes',
        'sweepstakes-list',
        `sweepstakes-list-${user.id}`,
        `sweepstakes-list-${input.slug}`,
        `user-${user.id}`,
        `team-${input.slug}`
      ],
      revalidate: minutesToSeconds(1)
    };
  })
  .handler(async ({ input, user, db }) => {
    const query = input.search
      ? ({
          details: {
            name: {
              contains: input.search,
              mode: 'insensitive'
            }
          }
        } as const)
      : {};
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        ...query,
        status:
          input.status && input.status !== 'ALL' ? input.status : undefined,
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
        details: true,
        timing: true
      },
      orderBy: input.sortField
        ? {
            [input.sortField]: input.sortDirection
          }
        : undefined
    });

    return sweepstakes.map((s) => {
      const timeLeft = getTimeLeft(s);
      return {
        id: s.id,
        name: s.details?.name ?? DEFAULT_SWEEPSTAKES_NAME,
        status: s.status,
        entries: 0,
        uniqueEntrants: 0,
        conversionRate: 0,
        botRate: 0,
        timeLeft,
        createdAt: s.createdAt.toISOString()
      };
    });
  });

const getTimeLeft = (
  sweepstake: Prisma.SweepstakesGetPayload<{
    include: {
      timing: true;
    };
  }>
): string => {
  const now = new Date();
  if (sweepstake.status === SweepstakesStatus.PAUSED) return 'Paused';
  if (sweepstake.status === SweepstakesStatus.COMPLETED) return 'Completed';
  if (sweepstake.status === SweepstakesStatus.CANCELED) return 'Canceled';
  if (sweepstake.status === SweepstakesStatus.DRAFT) return 'Not started';
  if (!sweepstake.timing?.endDate || !sweepstake.timing?.startDate)
    return 'Not started';
  if (isAfter(now, sweepstake.timing?.endDate)) return 'Completed';
  if (isAfter(sweepstake.timing?.startDate, now))
    return `Starts ${formatDistanceToNow(sweepstake.timing?.startDate, { addSuffix: true })}`;
  return `Ends ${formatDistance(sweepstake.timing?.endDate, now, { addSuffix: true })}`;
};

export default getSweepstakesList;
