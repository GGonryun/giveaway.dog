import 'server-only';

import { sleep } from 'workflow';
import { QUEUE_DRAIN_DEBOUNCE } from '../queue-drain-config';
import {
  beginQueueDrainPass,
  finishQueueDrainPass
} from '../queue-drain-steps';
import { processScoringBatch } from './steps';

export async function scoringDrainWorkflow() {
  'use workflow';

  await sleep(QUEUE_DRAIN_DEBOUNCE);

  for (;;) {
    const requests = await beginQueueDrainPass({ name: 'scoring' });
    let batch;
    do {
      batch = await processScoringBatch();
    } while (batch.total > 0);
    if (await finishQueueDrainPass({ name: 'scoring', requests })) return;
  }
}
