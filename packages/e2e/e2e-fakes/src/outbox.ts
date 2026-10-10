import 'server-only';

import { createE2eOutbox } from './store';

export { toE2eFakeId } from './store';

const outbox = createE2eOutbox(
  async () => (await import('@giveaway/cache/redis')).redis
);

export const recordE2eOutbox: typeof outbox.recordE2eOutbox = (record) =>
  outbox.recordE2eOutbox(record);

export const readE2eOutbox: typeof outbox.readE2eOutbox = (query) =>
  outbox.readE2eOutbox(query);
