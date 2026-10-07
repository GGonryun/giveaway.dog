'use server';

import { date } from '@giveaway/util-time/date';
import { procedure } from '@giveaway/rpc-server/procedures';
import { findUserSweepstakes } from '@giveaway/sweepstakes-access/shared';
import { TeamPermission } from '@giveaway/team-permissions';
import { PrismaClient, TeamTier } from '@giveaway/db-model';
import { DEFAULT_TIME_SERIES_DURATION } from '@giveaway/app-config/settings';
import { timeSeriesDataSchema } from '@giveaway/sweepstakes-model/schemas';
import { subDays } from 'date-fns/subDays';
import { groupBy, map } from 'lodash';
import { unstable_cache } from 'next/cache';
import z from 'zod';

const countEntriesPerDay = async (db: PrismaClient, sweepstakesId: string) => {
  const timeSeriesData = await db.taskCompletion.findMany({
    where: {
      task: {
        sweepstakesId
      },
      completedAt: {
        gte: subDays(new Date(), DEFAULT_TIME_SERIES_DURATION)
      }
    },
    orderBy: {
      completedAt: 'asc'
    }
  });

  return map(
    groupBy(timeSeriesData, (entry) =>
      date.format(entry.completedAt, 'dashed')
    ),
    (entries, date) => ({
      date,
      entries: entries.length
    })
  );
};

const getSweepstakesEntryTimeSeries = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string()
    })
  )
  .output(timeSeriesDataSchema.array())
  .handler(async ({ input: { sweepstakesId, slug }, db, user }) => {
    await findUserSweepstakes({
      db,
      user,
      id: sweepstakesId,
      slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    return unstable_cache(
      (id: string) => countEntriesPerDay(db, id),
      [`sweepstakes-entry-time-series-${sweepstakesId}`],
      {
        tags: [`sweepstakes-${sweepstakesId}`, 'sweepstakes-entry-time-series'],
        revalidate: 600
      }
    )(sweepstakesId);
  });

export default getSweepstakesEntryTimeSeries;
