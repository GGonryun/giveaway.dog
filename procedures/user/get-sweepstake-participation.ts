import { procedure } from '@/lib/mrpc/procedures';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { compact } from 'lodash';

const getSweepstakeParticipation = procedure
  .authorization({
    required: true
  })
  .output(publicSweepstakesSchema.array())
  .handler(async ({ db, user, input }) => {
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: 'ACTIVE',
        tasks: {
          some: {
            OR: [
              {
                completions: {
                  some: { userId: user.id }
                }
              },
              {
                progress: {
                  some: { userId: user.id }
                }
              }
            ]
          }
        }
      },
      include: PUBLIC_SWEEPSTAKES_PAYLOAD
    });

    return compact(sweepstakes.map(tryToPublicSweepstakes));
  });

export default getSweepstakeParticipation;
