import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scoringDrainWorkflow } from '../workflow';

const mocks = vi.hoisted(() => ({
  sleep: vi.fn(),
  begin: vi.fn(),
  finish: vi.fn(),
  batch: vi.fn()
}));

vi.mock('workflow', () => ({ sleep: mocks.sleep }));

vi.mock('../../queue-drain-steps', () => ({
  beginQueueDrainPass: mocks.begin,
  finishQueueDrainPass: mocks.finish
}));

vi.mock('../steps', () => ({ processScoringBatch: mocks.batch }));

const batch = (total: number) => ({ processed: total, errors: 0, total });

describe('scoringDrainWorkflow', () => {
  beforeEach(() => {
    mocks.sleep.mockReset().mockResolvedValue(undefined);
    mocks.begin.mockReset().mockResolvedValue(4);
    mocks.finish.mockReset().mockResolvedValue(true);
    mocks.batch.mockReset();
  });

  it('waits 30 seconds before the first pass, so a burst is handled together', async () => {
    mocks.batch.mockResolvedValue(batch(0));

    await scoringDrainWorkflow();

    expect(mocks.sleep).toHaveBeenCalledTimes(1);
    expect(mocks.sleep).toHaveBeenCalledWith('30s');
    const [sleep] = mocks.sleep.mock.invocationCallOrder;
    const [begin] = mocks.begin.mock.invocationCallOrder;
    expect(sleep).toBeLessThan(begin);
  });

  it('processes batches until one is empty, then frees the drain', async () => {
    mocks.batch
      .mockResolvedValueOnce(batch(2))
      .mockResolvedValueOnce(batch(1))
      .mockResolvedValue(batch(0));

    await scoringDrainWorkflow();

    expect(mocks.begin).toHaveBeenCalledWith({ name: 'scoring' });
    expect(mocks.batch).toHaveBeenCalledTimes(3);
    expect(mocks.finish).toHaveBeenCalledTimes(1);
    expect(mocks.finish).toHaveBeenCalledWith({ name: 'scoring', requests: 4 });
    const [finish] = mocks.finish.mock.invocationCallOrder;
    expect(mocks.batch.mock.invocationCallOrder[2]).toBeLessThan(finish);
  });

  it('runs another pass when a request arrived during the last one', async () => {
    mocks.begin.mockResolvedValueOnce(4).mockResolvedValueOnce(6);
    mocks.finish.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mocks.batch
      .mockResolvedValueOnce(batch(0))
      .mockResolvedValueOnce(batch(1))
      .mockResolvedValue(batch(0));

    await scoringDrainWorkflow();

    expect(mocks.sleep).toHaveBeenCalledTimes(1);
    expect(mocks.begin).toHaveBeenCalledTimes(2);
    expect(mocks.batch).toHaveBeenCalledTimes(3);
    expect(mocks.finish.mock.calls).toEqual([
      [{ name: 'scoring', requests: 4 }],
      [{ name: 'scoring', requests: 6 }]
    ]);
  });
});
