'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';
import { datetime } from '@/lib/date';
import { giveawayFiltersSchema } from '@/lib/filters/giveaway-filters';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';
import { z } from 'zod';

const getHistoricalSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .input(
    giveawayFiltersSchema
      .extend({
        page: z.number().int().min(1).optional()
      })
      .optional()
  )
  .output(publicSweepstakesSchema.array())
  .cache(({ input }) => ({
    keyParts: [
      'historical-sweepstakes-list',
      input?.page?.toString() ?? '1',
      input?.sortBy ?? 'default',
      input?.minEntrants?.toString() ?? 'no-min',
      input?.maxEntrants?.toString() ?? 'no-max',
      input?.hideCompleted?.toString() ?? 'false',
      input?.search ?? 'no-search'
    ],
    tags: ['historical-sweepstakes-list'],
    revalidate: 300
  }))
  .handler(async ({ db, input }) => {
    const daysAgo = datetime.daysAgo(1);
    const page = input?.page ?? 1;
    const skip = (page - 1) * HISTORY_PAGE_SIZE;

    let orderBy: any = {
      timing: {
        endDate: 'desc'
      }
    };

    if (input?.sortBy === 'entrants-desc') {
      orderBy = {
        participants: {
          _count: 'desc'
        }
      };
    } else if (input?.sortBy === 'entrants-asc') {
      orderBy = {
        participants: {
          _count: 'asc'
        }
      };
    } else if (input?.sortBy === 'newest') {
      orderBy = {
        createdAt: 'desc'
      };
    }

    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        visibility: { visibility: 'PUBLIC' },
        timing: {
          endDate: {
            lt: daysAgo
          }
        }
      },
      include: {
        ...PUBLIC_SWEEPSTAKES_PAYLOAD,
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy,
      skip,
      take: HISTORY_PAGE_SIZE
    });

    let results = compact(sweepstakes.map(tryToPublicSweepstakes));

    if (input?.minEntrants !== undefined) {
      results = results.filter((s) => s.participants >= input.minEntrants!);
    }

    if (input?.maxEntrants !== undefined) {
      results = results.filter((s) => s.participants <= input.maxEntrants!);
    }

    if (input?.search) {
      const searchLower = input.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
      );
    }

    return results;
  });

export default getHistoricalSweepstakesList;
