import { createE2eOutbox, E2eOutboxRedis } from '../store';
import { createFakeRedisLists } from './env';

export { toE2eFakeId } from '../store';

export const memoryOutbox = createFakeRedisLists();

export const { recordE2eOutbox, readE2eOutbox } = createE2eOutbox(
  async () => memoryOutbox.redis as unknown as E2eOutboxRedis
);

export const clearMemoryOutbox = () => {
  memoryOutbox.lists.clear();
  memoryOutbox.ttls.clear();
  for (const method of Object.values(memoryOutbox.redis)) method.mockClear();
};
