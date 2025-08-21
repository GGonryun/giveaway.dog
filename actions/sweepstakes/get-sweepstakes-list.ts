'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { SweepstakesData, sweepstakesDataSchema } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { Prisma, SweepstakesStatus } from '@prisma/client';
import {
  formatDistance,
  formatDuration,
  intervalToDuration,
  isAfter,
  isBefore
} from 'date-fns';

const listParamsSchema = z
  .object({
    statusFilter: z.nativeEnum(SweepstakesStatus),
    search: z.string(),
    sortField: z.string(),
    sortDirection: z.enum(['asc', 'desc'])
  })
  .partial();

const getSweepstakesList = procedure
  .authorized()
  .input(listParamsSchema)
  .output(sweepstakesDataSchema.array())
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: input.statusFilter,
        name: {
          contains: input.search,
          mode: 'insensitive'
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
        title: s.name ?? 'New Giveaway',
        status: s.status,
        entries: 0,
        uniqueEntrants: 0,
        conversionRate: 0,
        botRate: 0,
        timeLeft,
        createdAt: s.createdAt.toISOString(),
        topSource: 'TODO',
        prize: 'TODO'
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

interface GetSweepstakesListParams {
  statusFilter?: string;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export default getSweepstakesList;
