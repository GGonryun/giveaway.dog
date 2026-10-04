'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';
import { datetime } from '@giveaway/util-time/date';
import {
  giveawayFiltersSchema,
  PAGE_SIZE
} from '@/lib/filters/giveaway-filters';

const getPublicSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .input(giveawayFiltersSchema.optional())
  .output(publicSweepstakesSchema.array())
  .cache(({ input }) => ({
    keyParts: [
      'public-sweepstakes-list',
      input?.sortBy ?? 'default',
      input?.minEntrants?.toString() ?? 'no-min',
      input?.maxEntrants?.toString() ?? 'no-max',
      input?.search ?? 'no-search',
      input?.page?.toString() ?? '1',
      input?.showStatuses?.sort().join(',') ?? 'all',
      input?.hosts?.sort().join(',') ?? 'all-hosts'
    ],
    tags: ['public-sweepstakes-list'],
    revalidate: 300
  }))
  .handler(async ({ db, input }) => {
    const now = new Date();

    const daysFromNow = datetime.daysFromNow(1);
    const daysAgo = datetime.daysAgo(1);

    let orderBy: any = {
      participants: {
        _count: 'desc'
      }
    };

    if (input?.sortBy === 'entrants-asc') {
      orderBy = {
        participants: {
          _count: 'asc'
        }
      };
    } else if (input?.sortBy === 'ending-soon') {
      orderBy = {
        timing: {
          endDate: 'asc'
        }
      };
    } else if (input?.sortBy === 'newest') {
      orderBy = {
        createdAt: 'desc'
      };
    }

    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: 'ACTIVE',
        visibility: { visibility: 'PUBLIC' },
        OR: [
          {
            timing: {
              startDate: {
                lte: now
              },
              endDate: {
                gte: daysAgo
              }
            }
          },
          {
            timing: {
              startDate: {
                gt: now,
                lte: daysFromNow
              }
            }
          }
        ]
      },
      include: {
        ...PUBLIC_SWEEPSTAKES_PAYLOAD,
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy
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

    if (input?.showStatuses && input.showStatuses.length > 0) {
      const showSet = new Set(input.showStatuses);
      results = results.filter((s) => showSet.has(s.status as any));
    }

    if (input?.hosts && input.hosts.length > 0) {
      const hostSet = new Set(input.hosts);
      results = results.filter((s) => hostSet.has(s.host.slug));
    }

    const page = input?.page ?? 1;
    const pageSize = PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return results.slice(start, end);
  });

export default getPublicSweepstakesList;
