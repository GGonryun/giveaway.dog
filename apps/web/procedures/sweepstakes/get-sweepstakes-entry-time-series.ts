'use server';

import { date } from '@giveaway/util-time/date';
import { procedure } from '@giveaway/rpc-server/procedures';
import { DEFAULT_TIME_SERIES_DURATION } from '@giveaway/app-config/settings';
import { timeSeriesDataSchema } from '@/schemas/giveaway/schemas';
import { subDays } from 'date-fns';
import { groupBy, map } from 'lodash';
import z from 'zod';

const getSweepstakesEntryTimeSeries = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(timeSeriesDataSchema.array())
  .cache(({ input }) => ({
    keyParts: [`sweepstakes-entry-time-series-${input.sweepstakesId}`],
    tags: [
      `sweepstakes-${input.sweepstakesId}`,
      'sweepstakes-entry-time-series'
    ],
    revalidate: 600 // Cache for 10 minutes
  }))
  .handler(async ({ input: { sweepstakesId }, db }) => {
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

    const result = map(
      groupBy(timeSeriesData, (entry) =>
        date.format(entry.completedAt, 'dashed')
      ),
      (entries, date) => ({
        date,
        entries: entries.length
      })
    );

    return result;
  });

export default getSweepstakesEntryTimeSeries;
