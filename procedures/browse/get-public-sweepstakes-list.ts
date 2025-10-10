'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';

const getPublicSweepstakesList = procedure()
  .authorization({
    required: false
  })
  .output(publicSweepstakesSchema.array())
  .cache({
    keyParts: ['public-sweepstakes-list'],
    tags: ['public-sweepstakes-list'],
    revalidate: 300
  })
  .handler(async ({ db }) => {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            timing: {
              startDate: {
                lte: now
              },
              endDate: {
                gte: twoDaysAgo
              }
            }
          },
          {
            timing: {
              startDate: {
                gt: now,
                lte: twoDaysFromNow
              }
            }
          }
        ]
      },
      include: PUBLIC_SWEEPSTAKES_PAYLOAD
    });

    return compact(sweepstakes.map(tryToPublicSweepstakes));
  });

export default getPublicSweepstakesList;
