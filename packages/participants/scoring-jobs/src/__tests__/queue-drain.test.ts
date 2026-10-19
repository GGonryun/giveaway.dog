import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { ensureQueueDrain, touchQueueDrain } from '../queue-drain';
import {
  QUEUE_DRAIN_DEBOUNCE,
  QUEUE_DRAIN_STALE_MS
} from '../queue-drain-config';

const mocks = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => ({ start: mocks.start }));

const NOW = new Date('2026-10-19T12:00:00.000Z');

const workflow = async () => undefined;

describe('queue drain config', () => {
  it('waits 30 seconds and treats a drain without a heartbeat for 15 minutes as stuck', () => {
    expect(QUEUE_DRAIN_DEBOUNCE).toBe('30s');
    expect(QUEUE_DRAIN_STALE_MS).toBe(900_000);
  });
});

describe('ensureQueueDrain', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    mocks.start.mockReset();
    mocks.start.mockResolvedValue({ runId: 'run-1' });
    prismaMock.queueDrain.upsert.mockResolvedValue({});
    prismaMock.queueDrain.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.queueDrain.update.mockResolvedValue({});
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('records the request before it tries to claim the drain', async () => {
    await ensureQueueDrain('tracking', workflow);

    expect(prismaMock.queueDrain.upsert).toHaveBeenCalledWith({
      where: { name: 'tracking' },
      create: { name: 'tracking', requests: 1 },
      update: { requests: { increment: 1 }, requestedAt: NOW }
    });
    const [upsert] = prismaMock.queueDrain.upsert.mock.invocationCallOrder;
    const [claim] = prismaMock.queueDrain.updateMany.mock.invocationCallOrder;
    expect(upsert).toBeLessThan(claim);
  });

  it('claims the drain only when it is not running or its heartbeat is stale', async () => {
    await ensureQueueDrain('scoring', workflow);

    expect(prismaMock.queueDrain.updateMany).toHaveBeenCalledWith({
      where: {
        name: 'scoring',
        OR: [
          { running: false },
          {
            heartbeatAt: {
              lt: new Date(NOW.getTime() - QUEUE_DRAIN_STALE_MS)
            }
          }
        ]
      },
      data: { running: true, runId: null, heartbeatAt: NOW }
    });
  });

  it('starts the workflow and saves its run id when it wins the claim', async () => {
    await ensureQueueDrain('tracking', workflow);

    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledWith(workflow);
    expect(prismaMock.queueDrain.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.queueDrain.update).toHaveBeenCalledWith({
      where: { name: 'tracking' },
      data: { runId: 'run-1' }
    });
  });

  it('starts nothing when a drain is already running', async () => {
    prismaMock.queueDrain.updateMany.mockResolvedValue({ count: 0 });

    await ensureQueueDrain('tracking', workflow);

    expect(mocks.start).not.toHaveBeenCalled();
    expect(prismaMock.queueDrain.update).not.toHaveBeenCalled();
  });

  it('frees the drain and logs when the workflow does not start', async () => {
    const error = new Error('queue down');
    mocks.start.mockRejectedValue(error);

    await expect(
      ensureQueueDrain('scoring', workflow)
    ).resolves.toBeUndefined();

    expect(prismaMock.queueDrain.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.queueDrain.update).toHaveBeenCalledWith({
      where: { name: 'scoring' },
      data: { running: false }
    });
    expect(console.error).toHaveBeenCalledWith(
      'Failed to start the scoring queue drain:',
      error
    );
  });

  it('never throws to its caller when the database fails', async () => {
    const error = new Error('db down');
    prismaMock.queueDrain.upsert.mockRejectedValue(error);

    await expect(
      ensureQueueDrain('tracking', workflow)
    ).resolves.toBeUndefined();

    expect(prismaMock.queueDrain.updateMany).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to start the tracking queue drain:',
      error
    );
  });
});

describe('touchQueueDrain', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the heartbeat of the drain', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    await touchQueueDrain('scoring');

    expect(prismaMock.queueDrain.updateMany).toHaveBeenCalledWith({
      where: { name: 'scoring' },
      data: { heartbeatAt: NOW }
    });
  });
});
