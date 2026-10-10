import 'server-only';

import { createE2eOutbox } from './store';

export { toE2eFakeId } from './store';

export const { recordE2eOutbox, readE2eOutbox } = createE2eOutbox(
  async () => (await import('@giveaway/cache/redis')).redis
);
