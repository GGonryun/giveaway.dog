import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { runUserScoring } from '@giveaway/scoring-server/run-user-scoring';
import { touchQueueDrain } from '../queue-drain';

export async function processScoringBatch() {
  'use step';

  const result = await runUserScoring(prisma);
  await touchQueueDrain('scoring');
  return result;
}
