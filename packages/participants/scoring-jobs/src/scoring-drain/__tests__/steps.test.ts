import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { runUserScoring } from '@giveaway/scoring-server/run-user-scoring';
import { touchQueueDrain } from '../../queue-drain';
import { processScoringBatch } from '../steps';

vi.mock('@giveaway/scoring-server/run-user-scoring', () => ({
  runUserScoring: vi.fn()
}));
vi.mock('../../queue-drain', () => ({ touchQueueDrain: vi.fn() }));

describe('processScoringBatch', () => {
  it('scores one batch with the root client, refreshes the heartbeat and returns the counts', async () => {
    const result = { processed: 2, errors: 1, total: 3 };
    vi.mocked(runUserScoring).mockResolvedValue(result);

    await expect(processScoringBatch()).resolves.toEqual(result);

    expect(runUserScoring).toHaveBeenCalledWith(prismaMock);
    expect(touchQueueDrain).toHaveBeenCalledWith('scoring');
  });
});
