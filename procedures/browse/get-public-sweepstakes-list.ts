'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';
import { datetime } from '@/lib/date';

const getPublicSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .output(publicSweepstakesSchema.array())
  .handler(async ({ db }) => {
    const now = new Date();

    const daysFromNow = datetime.daysFromNow(1);
    const daysAgo = datetime.daysAgo(1);

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
      orderBy: {
        participants: {
          _count: 'desc'
        }
      }
    });

    return compact(sweepstakes.map(tryToPublicSweepstakes));
  });

export default getPublicSweepstakesList;
