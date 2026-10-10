import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_FAKE_ID_PREFIX,
  E2E_OUTBOX_MAX_ENTRIES,
  E2E_OUTBOX_TTL_SECONDS
} from '@giveaway/e2e-model/fakes';
import {
  createFakeRedisLists,
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '../testing/env';

const fake = vi.hoisted(() => ({
  current: undefined as
    | ReturnType<typeof import('../testing/env').createFakeRedisLists>
    | undefined
}));

vi.mock('@giveaway/cache/redis', () => ({
  get redis() {
    return fake.current!.redis;
  }
}));

const { readE2eOutbox, recordE2eOutbox } = await import('../outbox');

const EMAIL = 'e2e-invitee-abcd12@example.com';

beforeEach(() => {
  fake.current = createFakeRedisLists();
  stubE2eFakeEnvironment('preview');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('recordE2eOutbox', () => {
  it('stores the entry under the key of its channel and target', async () => {
    const entry = await recordE2eOutbox({
      channel: 'email',
      target: EMAIL,
      payload: { subject: 'Hello' }
    });

    expect(entry).toEqual({
      channel: 'email',
      target: EMAIL,
      at: expect.any(String),
      id: expect.stringMatching(new RegExp(`^${E2E_FAKE_ID_PREFIX}`)),
      payload: { subject: 'Hello' }
    });
    expect(fake.current!.lists.get(`e2e:outbox:email:${EMAIL}`)).toEqual([
      entry
    ]);
  });

  it('expires the list after the outbox time to live', async () => {
    await recordE2eOutbox({ channel: 'x', target: 'team1', payload: {} });

    expect(fake.current!.ttls.get('e2e:outbox:x:team1')).toBe(
      E2E_OUTBOX_TTL_SECONDS
    );
    expect(E2E_OUTBOX_TTL_SECONDS).toBe(3600);
  });

  it('keeps only the newest entries', async () => {
    for (let index = 0; index < E2E_OUTBOX_MAX_ENTRIES + 2; index++) {
      await recordE2eOutbox({
        channel: 'discord',
        target: '123',
        payload: { index }
      });
    }

    const entries = await readE2eOutbox({ channel: 'discord', target: '123' });
    expect(entries).toHaveLength(E2E_OUTBOX_MAX_ENTRIES);
    expect(entries[0].payload).toEqual({ index: 2 });
  });

  it('reads the key in lower case, as Auth.js writes the emails', async () => {
    await recordE2eOutbox({
      channel: 'email',
      target: EMAIL.toUpperCase(),
      payload: {}
    });

    await expect(
      readE2eOutbox({ channel: 'email', target: EMAIL })
    ).resolves.toHaveLength(1);
  });

  it('refuses a target with other characters', async () => {
    await expect(
      recordE2eOutbox({ channel: 'email', target: 'a b:c', payload: {} })
    ).rejects.toThrow();
    expect(fake.current!.redis.rpush).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)(
    'never writes to Redis on %s',
    async (environment) => {
      stubE2eFakeEnvironment(environment);

      await expect(
        recordE2eOutbox({ channel: 'email', target: EMAIL, payload: {} })
      ).rejects.toThrow('e2e gate');
      expect(fake.current!.redis.rpush).not.toHaveBeenCalled();
    }
  );
});

describe('readE2eOutbox', () => {
  it('returns no entries for a key that has none', async () => {
    await expect(
      readE2eOutbox({ channel: 'bluesky', target: 'team1' })
    ).resolves.toEqual([]);
  });
});
