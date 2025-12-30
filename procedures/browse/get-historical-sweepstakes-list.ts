'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';
import { datetime } from '@/lib/date';
import { z } from 'zod';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';

const getHistoricalSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .input(
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(HISTORY_PAGE_SIZE)
      })
      .optional()
  )
  .output(publicSweepstakesSchema.array())
  .handler(async ({ db, input }) => {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? HISTORY_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const daysAgo = datetime.daysAgo(1);

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
      orderBy: {
        timing: {
          endDate: 'desc'
        }
      },
      skip,
      take: limit
    });

    return compact(sweepstakes.map(tryToPublicSweepstakes));
  });

export default getHistoricalSweepstakesList;
