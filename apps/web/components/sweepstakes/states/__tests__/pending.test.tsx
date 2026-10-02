import { act, fireEvent, screen } from '@testing-library/react';
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

const flushPromises = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
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
    it('shows a relative countdown to the start date', () => {
      renderPending(secondsFromNow(2 * 24 * 60 * 60));
      expect(
        screen.getByRole('heading', { name: 'Giveaway Starting Soon' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('This giveaway will begin in 2 days')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /refresh page/i })
      ).not.toBeInTheDocument();
    });

    it('updates the countdown every second', () => {
      renderPending(secondsFromNow(90));
      expect(
        screen.getByText('This giveaway will begin in 2 minutes')
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(45_000);
      });

      expect(
        screen.getByText('This giveaway will begin in 1 minute')
      ).toBeInTheDocument();
    });
  });

  describe('when the start date passes while the page is open', () => {
    it('switches to the started state with a refresh button', () => {
      renderPending(secondsFromNow(3));

      act(() => {
        vi.advanceTimersByTime(3_000);
      });

      expect(
        screen.getByRole('heading', { name: 'Giveaway Has Started!' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Refresh Page' })
      ).toBeEnabled();
    });
  });

  describe('when the giveaway has already started', () => {
    it('invites the visitor to refresh the page', () => {
      renderPending(secondsFromNow(-60));
      expect(
        screen.getByText(
          'This giveaway is now live. Click below to refresh the page and participate.'
        )
      ).toBeInTheDocument();
    });

    it('invalidates the sweepstakes cache and refreshes the route', async () => {
      vi.mocked(refreshSweepstakes).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderPending(secondsFromNow(-60));

      fireEvent.click(screen.getByRole('button', { name: 'Refresh Page' }));
      await flushPromises();

      expect(refreshSweepstakes).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-42'
      });
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('disables the button while the refresh is in progress', async () => {
      vi.mocked(refreshSweepstakes).mockReturnValue(new Promise(() => {}));
      renderPending(secondsFromNow(-60));

      fireEvent.click(screen.getByRole('button', { name: 'Refresh Page' }));
      await flushPromises();

      const button = screen.getByRole('button', { name: 'Refreshing...' });
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toHaveClass('animate-spin');
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });
  });
});
