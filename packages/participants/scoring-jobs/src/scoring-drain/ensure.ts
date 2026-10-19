import 'server-only';

import { ensureQueueDrain } from '../queue-drain';
import { scoringDrainWorkflow } from './workflow';

export const ensureScoringDrain = () =>
  ensureQueueDrain('scoring', scoringDrainWorkflow);
