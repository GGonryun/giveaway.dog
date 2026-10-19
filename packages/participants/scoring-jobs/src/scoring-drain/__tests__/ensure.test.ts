import { describe, it, expect, vi } from 'vitest';
import { ensureQueueDrain } from '../../queue-drain';
import { ensureScoringDrain } from '../ensure';
import { scoringDrainWorkflow } from '../workflow';

vi.mock('../../queue-drain', () => ({ ensureQueueDrain: vi.fn() }));
vi.mock('../workflow', () => ({ scoringDrainWorkflow: vi.fn() }));

describe('ensureScoringDrain', () => {
  it('makes sure the scoring drain workflow is running', async () => {
    vi.mocked(ensureQueueDrain).mockResolvedValue(undefined);

    await expect(ensureScoringDrain()).resolves.toBeUndefined();

    expect(ensureQueueDrain).toHaveBeenCalledWith(
      'scoring',
      scoringDrainWorkflow
    );
  });
});
