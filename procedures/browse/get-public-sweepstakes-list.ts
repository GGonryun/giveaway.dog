import { procedure } from '@/lib/mrpc/procedures';
import {
  publicSweepstakesSchema,
  tryToPublicSweepstakes
} from '@/schemas/giveaway/public';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { compact } from 'lodash';

const getPublicSweepstakesList = procedure
  .authorization({
    required: false
  })
  .output(publicSweepstakesSchema.array())
  // TODO: update public sweepstakes cache
  .handler(async ({ db }) => {
    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: FORM_SWEEPSTAKES_PAYLOAD
    });

    return compact(sweepstakes.map(tryToPublicSweepstakes));
  });

export default getPublicSweepstakesList;
