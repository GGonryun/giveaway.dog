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

const getPublicSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .input(giveawayFiltersSchema.optional())
  .output(publicSweepstakesSchema.array())
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

    return results;
  });

export default getPublicSweepstakesList;
