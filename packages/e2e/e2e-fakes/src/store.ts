import 'server-only';

import { isE2eGateOpen } from '@giveaway/e2e-gate/gate';
import {
  E2E_FAKE_ID_PREFIX,
  E2E_OUTBOX_MAX_ENTRIES,
  E2E_OUTBOX_TTL_SECONDS,
  E2eOutboxEntry,
  E2eOutboxQuery,
  e2eOutboxQuerySchema,
  toE2eOutboxKey
} from '@giveaway/e2e-model/fakes';
import { nanoid } from 'nanoid';

export type E2eOutboxRedis = {
  rpush: (key: string, ...values: E2eOutboxEntry[]) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<unknown>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  lrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
};

export type E2eOutboxRecord = E2eOutboxQuery & {
  payload: Record<string, unknown>;
};

export const toE2eFakeId = () => `${E2E_FAKE_ID_PREFIX}${nanoid()}`;

export const createE2eOutbox = (loadRedis: () => Promise<E2eOutboxRedis>) => {
  const recordE2eOutbox = async ({
    channel,
    target,
    payload
  }: E2eOutboxRecord): Promise<E2eOutboxEntry> => {
    if (!isE2eGateOpen()) {
      throw new Error('The e2e outbox exists only where the e2e gate is open');
    }
    const query = e2eOutboxQuerySchema.parse({ channel, target });
    const key = toE2eOutboxKey(query);
    const entry: E2eOutboxEntry = {
      ...query,
      at: new Date().toISOString(),
      id: toE2eFakeId(),
      payload
    };

    const redis = await loadRedis();
    await redis.rpush(key, entry);
    await redis.ltrim(key, -E2E_OUTBOX_MAX_ENTRIES, -1);
    await redis.expire(key, E2E_OUTBOX_TTL_SECONDS);

    console.info(
      '[e2e] Recorded in the outbox instead of sending',
      JSON.stringify({ channel: query.channel, id: entry.id })
    );
    return entry;
  };

  const readE2eOutbox = async (
    query: E2eOutboxQuery
  ): Promise<E2eOutboxEntry[]> => {
    const redis = await loadRedis();
    return redis.lrange<E2eOutboxEntry>(toE2eOutboxKey(query), 0, -1);
  };

  return { recordE2eOutbox, readE2eOutbox };
};
