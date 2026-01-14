'use server';

import { date } from '@/lib/date';
import { procedure } from '@/lib/mrpc/procedures';
import { DEFAULT_TIME_SERIES_DURATION } from '@/lib/settings';
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
