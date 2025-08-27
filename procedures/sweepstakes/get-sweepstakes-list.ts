'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { Prisma, SweepstakesStatus } from '@prisma/client';
import { formatDistance, isAfter, minutesToSeconds } from 'date-fns';
import {
  sweepstakesDataSchema,
  listSweepstakesFiltersSchema
} from '@/schemas/sweepstakes';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';

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
      revalidate: minutesToSeconds(10)
    };
  })
  .handler(async ({ input, user, db }) => {
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status:
          input.status && input.status !== 'ALL' ? input.status : undefined,
        name: {
          contains: input.search,
          mode: 'insensitive'
        },
        team: {
          slug: input.slug,
          members: {
            some: {
              userId: user.id
            }
          }
        }
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
        name: s.name ?? DEFAULT_SWEEPSTAKES_NAME,
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

const getTimeLeft = (sweepstake: Prisma.SweepstakesGetPayload<{}>): string => {
  const now = new Date();
  if (sweepstake.status === SweepstakesStatus.PAUSED) return 'Paused';
  if (sweepstake.status === SweepstakesStatus.COMPLETED) return 'Completed';
  if (sweepstake.status === SweepstakesStatus.CANCELED) return 'Canceled';
  if (sweepstake.status === SweepstakesStatus.DRAFT) return 'Not started';
  if (!sweepstake.endDate || !sweepstake.startDate) return 'Not started';
  if (isAfter(sweepstake.endDate, now)) return 'Completed';
  if (isAfter(sweepstake.startDate, now))
    return `Starts ${formatDistance(new Date(), sweepstake.startDate, { addSuffix: true })}`;
  return formatDistance(now, sweepstake.endDate, { addSuffix: true });
};

export default getSweepstakesList;
