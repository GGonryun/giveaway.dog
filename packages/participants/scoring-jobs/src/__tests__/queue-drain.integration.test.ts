import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import { ensureQueueDrain } from '../queue-drain';
import {
  beginQueueDrainPass,
  finishQueueDrainPass
} from '../queue-drain-steps';
import { QUEUE_DRAIN_STALE_MS } from '../queue-drain-config';

const mocks = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => ({ start: mocks.start }));

const workflow = async () => undefined;

const drain = () =>
  db.queueDrain.findUniqueOrThrow({ where: { name: 'scoring' } });

describe('ensureQueueDrain', () => {
  beforeEach(() => {
    let runs = 0;
    mocks.start.mockReset();
    mocks.start.mockImplementation(async () => ({ runId: `run-${++runs}` }));
  });

  it('starts one drain run for many requests at the same time', async () => {
    await Promise.all(
      Array.from({ length: 20 }, () => ensureQueueDrain('scoring', workflow))
    );

    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(await drain()).toMatchObject({
      running: true,
      runId: 'run-1',
      requests: 20
    });
  });

  it('starts a new run once the last one has finished', async () => {
    await ensureQueueDrain('scoring', workflow);
    const requests = await beginQueueDrainPass({ name: 'scoring' });
    expect(await finishQueueDrainPass({ name: 'scoring', requests })).toBe(
      true
    );

    await ensureQueueDrain('scoring', workflow);

    expect(mocks.start).toHaveBeenCalledTimes(2);
    expect(await drain()).toMatchObject({ running: true, runId: 'run-2' });
  });

  it('keeps the drain running when a request arrives during a pass', async () => {
    await ensureQueueDrain('scoring', workflow);
    const requests = await beginQueueDrainPass({ name: 'scoring' });

    await ensureQueueDrain('scoring', workflow);

    expect(await finishQueueDrainPass({ name: 'scoring', requests })).toBe(
      false
    );
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(await drain()).toMatchObject({ running: true });

    const next = await beginQueueDrainPass({ name: 'scoring' });
    expect(
      await finishQueueDrainPass({ name: 'scoring', requests: next })
    ).toBe(true);
    expect(await drain()).toMatchObject({ running: false, runId: null });
  });

  it('takes over a drain whose heartbeat is stale', async () => {
    await ensureQueueDrain('scoring', workflow);
    await db.queueDrain.update({
      where: { name: 'scoring' },
      data: { heartbeatAt: new Date(Date.now() - QUEUE_DRAIN_STALE_MS - 1000) }
    });

    await ensureQueueDrain('scoring', workflow);

    expect(mocks.start).toHaveBeenCalledTimes(2);
    expect(await drain()).toMatchObject({ running: true, runId: 'run-2' });
  });

  it('does not take over a drain with a recent heartbeat', async () => {
    await ensureQueueDrain('scoring', workflow);
    await db.queueDrain.update({
      where: { name: 'scoring' },
      data: {
        heartbeatAt: new Date(Date.now() - QUEUE_DRAIN_STALE_MS + 60_000)
      }
    });

    await ensureQueueDrain('scoring', workflow);

    expect(mocks.start).toHaveBeenCalledTimes(1);
  });
});
