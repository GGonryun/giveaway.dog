import { describe, it, expect, afterEach, vi } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  beginQueueDrainPass,
  finishQueueDrainPass
} from '../queue-drain-steps';

const NOW = new Date('2026-10-19T12:00:00.000Z');

describe('beginQueueDrainPass', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the heartbeat and returns the number of requests so far', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    prismaMock.queueDrain.upsert.mockResolvedValue({ requests: 7 });

    await expect(beginQueueDrainPass({ name: 'tracking' })).resolves.toBe(7);
    expect(prismaMock.queueDrain.upsert).toHaveBeenCalledWith({
      where: { name: 'tracking' },
      create: { name: 'tracking', running: true },
      update: { heartbeatAt: NOW }
    });
  });
});

describe('finishQueueDrainPass', () => {
  it('frees the drain when no request arrived during the pass', async () => {
    prismaMock.queueDrain.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      finishQueueDrainPass({ name: 'scoring', requests: 3 })
    ).resolves.toBe(true);
    expect(prismaMock.queueDrain.updateMany).toHaveBeenCalledWith({
      where: { name: 'scoring', requests: 3 },
      data: { running: false, runId: null }
    });
  });

  it('keeps the drain running when a request arrived during the pass', async () => {
    prismaMock.queueDrain.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      finishQueueDrainPass({ name: 'scoring', requests: 3 })
    ).resolves.toBe(false);
  });
});
