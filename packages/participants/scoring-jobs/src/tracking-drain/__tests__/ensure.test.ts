import { describe, it, expect, vi } from 'vitest';
import { ensureQueueDrain } from '../../queue-drain';
import { ensureTrackingDrain } from '../ensure';
import { trackingDrainWorkflow } from '../workflow';

vi.mock('../../queue-drain', () => ({ ensureQueueDrain: vi.fn() }));
vi.mock('../workflow', () => ({ trackingDrainWorkflow: vi.fn() }));

describe('ensureTrackingDrain', () => {
  it('makes sure the tracking drain workflow is running', async () => {
    vi.mocked(ensureQueueDrain).mockResolvedValue(undefined);

    await expect(ensureTrackingDrain()).resolves.toBeUndefined();

    expect(ensureQueueDrain).toHaveBeenCalledWith(
      'tracking',
      trackingDrainWorkflow
    );
  });
});
