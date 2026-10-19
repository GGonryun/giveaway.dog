import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { runUserTracking } from '@giveaway/scoring-server/run-user-tracking';
import { touchQueueDrain } from '../queue-drain';
import { ensureScoringDrain } from '../scoring-drain/ensure';

export async function processTrackingBatch() {
  'use step';

  const result = await runUserTracking(prisma);
  await touchQueueDrain('tracking');
  if (result.processed > 0) await ensureScoringDrain();
  return result;
}
