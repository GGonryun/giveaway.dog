import 'server-only';

import { ensureQueueDrain } from '../queue-drain';
import { trackingDrainWorkflow } from './workflow';

export const ensureTrackingDrain = () =>
  ensureQueueDrain('tracking', trackingDrainWorkflow);
