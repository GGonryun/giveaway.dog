import 'server-only';

import { sleep } from 'workflow';
import { QUEUE_DRAIN_DEBOUNCE } from '../queue-drain-config';
import {
  beginQueueDrainPass,
  finishQueueDrainPass
} from '../queue-drain-steps';
import { processTrackingBatch } from './steps';

export async function trackingDrainWorkflow() {
  'use workflow';

  await sleep(QUEUE_DRAIN_DEBOUNCE);

  for (;;) {
    const requests = await beginQueueDrainPass({ name: 'tracking' });
    let batch;
    do {
      batch = await processTrackingBatch();
    } while (batch.total > 0);
    if (await finishQueueDrainPass({ name: 'tracking', requests })) return;
  }
}
