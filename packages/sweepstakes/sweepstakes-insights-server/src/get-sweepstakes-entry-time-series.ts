'use server';

import { date } from '@giveaway/util-time/date';
import { procedure } from '@giveaway/rpc-server/procedures';
import { DEFAULT_TIME_SERIES_DURATION } from '@giveaway/app-config/settings';
import { timeSeriesDataSchema } from '@giveaway/sweepstakes-model/schemas';
import { PrismaClient } from '@giveaway/db-model';
import { subDays } from 'date-fns/subDays';
import { groupBy, map } from 'lodash';
import { unstable_cache } from 'next/cache';
import z from 'zod';
import { findTeamSweepstakes } from './team-sweepstakes';

const loadEntryTimeSeries = async (db: PrismaClient, sweepstakesId: string) => {
  // group taskCompletion by date and count entries and only return the last 7 days.
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
  .handler(async ({ input: { sweepstakesId, slug }, user, db }) => {
    await findTeamSweepstakes({ db, userId: user.id, sweepstakesId, slug });

    const cached = unstable_cache(
      (id: string) => loadEntryTimeSeries(db, id),
      [`sweepstakes-entry-time-series-${sweepstakesId}`],
      {
        tags: [`sweepstakes-${sweepstakesId}`, 'sweepstakes-entry-time-series'],
        revalidate: 600 // Cache for 10 minutes
      }
    );

    return cached(sweepstakesId);
  });

export default getSweepstakesEntryTimeSeries;
