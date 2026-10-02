import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import refreshSweepstakes from '@/procedures/browse/refresh-sweepstakes';
import {
  NOW,
  buildSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import { Pending } from '../pending';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('@/procedures/browse/refresh-sweepstakes', () => ({
  default: vi.fn()
}));

const secondsFromNow = (seconds: number) =>
  new Date(NOW.getTime() + seconds * 1000);

const renderPending = (startDate: Date) =>
  renderWithParticipation(<Pending />, {
    state: 'pending',
    sweepstakes: buildSweepstakes({
      id: 'sweep-42',
      status: 'SCHEDULED',
      timing: {
        startDate,
        endDate: secondsFromNow(14 * 24 * 60 * 60),
        timeZone: 'UTC'
      }
    })
  });

describe('Pending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.mocked(refreshSweepstakes).mockReset();
    navigation.router.refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('before the giveaway starts', () => {
    it('matches the snapshot', () => {
      const { container } = renderPending(secondsFromNow(2 * 24 * 60 * 60));
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the giveaway has already started', () => {
    it('matches the snapshot', () => {
      const { container } = renderPending(secondsFromNow(-60));
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
