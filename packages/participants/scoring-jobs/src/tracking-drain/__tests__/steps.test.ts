import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { runUserTracking } from '@giveaway/scoring-server/run-user-tracking';
import { touchQueueDrain } from '../../queue-drain';
import { ensureScoringDrain } from '../../scoring-drain/ensure';
import { processTrackingBatch } from '../steps';

vi.mock('@giveaway/scoring-server/run-user-tracking', () => ({
  runUserTracking: vi.fn()
}));
vi.mock('../../queue-drain', () => ({ touchQueueDrain: vi.fn() }));
vi.mock('../../scoring-drain/ensure', () => ({ ensureScoringDrain: vi.fn() }));

describe('processTrackingBatch', () => {
  beforeEach(() => {
    vi.mocked(runUserTracking).mockReset();
    vi.mocked(ensureScoringDrain).mockReset();
  });

  it('processes one batch with the root client, refreshes the heartbeat and returns the counts', async () => {
    const result = { processed: 2, errors: 1, total: 3 };
    vi.mocked(runUserTracking).mockResolvedValue(result);

    await expect(processTrackingBatch()).resolves.toEqual(result);

    expect(runUserTracking).toHaveBeenCalledWith(prismaMock);
    expect(touchQueueDrain).toHaveBeenCalledWith('tracking');
  });

  it('starts the scoring drain when the batch queued scoring requests', async () => {
    vi.mocked(runUserTracking).mockResolvedValue({
      processed: 1,
      errors: 0,
      total: 1
    });

    await processTrackingBatch();

    expect(ensureScoringDrain).toHaveBeenCalledTimes(1);
  });

  it('does not start the scoring drain when no event was processed', async () => {
    vi.mocked(runUserTracking).mockResolvedValue({
      processed: 0,
      errors: 1,
      total: 1
    });

    await processTrackingBatch();

    expect(ensureScoringDrain).not.toHaveBeenCalled();
  });
});
