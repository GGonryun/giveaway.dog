import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import {
  buildAllocations,
  buildPrize
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from '@giveaway/sweepstakes-participation-core/testing/participation-fixtures';
import { PrizeItem } from '../prize-item';

vi.mock('next/navigation', () => ({
  usePathname: () => '/browse/summer-giveaway',
  useSearchParams: () => new URLSearchParams()
}));

vi.mock('@giveaway/auth-login-ui/login-options', () => ({
  LoginOptions: ({ label }: { label: string }) => (
    <div data-testid="login-options">{label}</div>
  )
}));

type PrizeItemProps = ComponentProps<typeof PrizeItem>;

const renderPrizeItem = (props: Partial<PrizeItemProps> = {}) =>
  renderWithParticipation(
    <PrizeItem
      prize={buildPrize()}
      isConnected
      open={false}
      state="unallocated"
      allocations={buildAllocations()}
      {...props}
    />
  );

describe('PrizeItem', () => {
  beforeEach(() => {
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
  });

  describe('header', () => {
    it.each([
      [1, '1 winner'],
      [3, '3 winners']
    ])('shows the quota %i as "%s"', (quota, text) => {
      renderPrizeItem({ prize: buildPrize({ quota }) });
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('marks the most popular prize with a trending up icon', () => {
      const { container } = renderPrizeItem();
      expect(
        container.querySelector('.lucide-trending-up')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.lucide-trending-down')
      ).not.toBeInTheDocument();
    });

    it('marks the least popular prize with a trending down icon', () => {
      const { container } = renderPrizeItem({
        prize: buildPrize({ id: 'prize-2', name: 'Gift Card' })
      });
      expect(
        container.querySelector('.lucide-trending-down')
      ).toBeInTheDocument();
    });

    it('calls onToggleExpand when the header is clicked', () => {
      const onToggleExpand = vi.fn();
      renderPrizeItem({ onToggleExpand });
      fireEvent.click(screen.getByRole('heading', { name: 'Gaming Headset' }));
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });
  });

  describe('when collapsed', () => {
    it('hides the prize details', () => {
      renderPrizeItem();
      expect(screen.queryByText('Prize Details')).not.toBeInTheDocument();
    });

    it('does not scroll the prize into view', () => {
      renderPrizeItem();
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('when expanded', () => {
    it('scrolls the prize into the center of the view', () => {
      renderPrizeItem({ open: true });
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
    });

    it('describes how many winners receive the prize', () => {
      renderPrizeItem({ open: true, prize: buildPrize({ quota: 2 }) });
      expect(
        screen.getByText('2 winners will receive this prize')
      ).toBeInTheDocument();
    });

    it('shows the popularity of the prize among all selections', () => {
      renderPrizeItem({ open: true });
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
      expect(screen.getByText('(3/4) 75%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('labels the least popular prize as having the best odds', () => {
      renderPrizeItem({
        open: true,
        prize: buildPrize({ id: 'prize-2', name: 'Gift Card' })
      });
      expect(screen.getByText('Best Odds')).toBeInTheDocument();
      expect(screen.getByText('(1/4) 25%')).toBeInTheDocument();
    });

    it('hides popularity when nobody has selected a prize yet', () => {
      renderPrizeItem({
        open: true,
        allocations: buildAllocations({
          totalAllocations: 0,
          allocationsByPrize: []
        })
      });
      expect(screen.queryByText('Popularity')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('hides popularity when allocation statistics are missing', () => {
      renderPrizeItem({ open: true, allocations: undefined });
      expect(screen.queryByText('Popularity')).not.toBeInTheDocument();
    });

    it('shows login options instead of details when the user is not connected', () => {
      renderPrizeItem({ open: true, isConnected: false });
      expect(screen.getByTestId('login-options')).toHaveTextContent(
        'Connect to participate...'
      );
      expect(screen.queryByText('Prize Details')).not.toBeInTheDocument();
    });

    it('does not offer any action when prize selection is disabled', () => {
      renderPrizeItem({ open: true });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('selecting a prize', () => {
    it('calls onAllocate when an unallocated prize is selected', () => {
      const onAllocate = vi.fn();
      renderPrizeItem({ open: true, onAllocate });
      fireEvent.click(
        screen.getByRole('button', { name: 'Select This Prize' })
      );
      expect(onAllocate).toHaveBeenCalledTimes(1);
    });

    it('offers selecting another prize when a different prize is allocated', () => {
      renderPrizeItem({ open: true, state: 'allocated', onAllocate: vi.fn() });
      expect(
        screen.getByRole('button', { name: 'Select This Prize' })
      ).toBeEnabled();
    });

    it('disables the button while the selection is saving', () => {
      renderPrizeItem({ open: true, state: 'allocating', onAllocate: vi.fn() });
      expect(
        screen.getByRole('button', { name: 'Selecting...' })
      ).toBeDisabled();
    });

    it('sends the user back to the tasks when this prize is already selected', () => {
      const onSeeTasks = vi.fn();
      const onAllocate = vi.fn();
      renderPrizeItem({
        open: true,
        state: 'allocation',
        onAllocate,
        onSeeTasks
      });
      fireEvent.click(
        screen.getByRole('button', { name: 'Complete Tasks to Win' })
      );
      expect(onSeeTasks).toHaveBeenCalledTimes(1);
      expect(onAllocate).not.toHaveBeenCalled();
    });
  });

  describe('allocation styles', () => {
    it('highlights the allocated prize', () => {
      const { container } = renderPrizeItem({ state: 'allocation' });
      expect(container.firstChild).toHaveClass('border-amber-500');
    });

    it('dims other prizes while collapsed', () => {
      const { container } = renderPrizeItem({ state: 'allocated' });
      expect(container.firstChild).toHaveClass('opacity-70');
    });

    it('does not dim other prizes while expanded', () => {
      const { container } = renderPrizeItem({ state: 'allocated', open: true });
      expect(container.firstChild).not.toHaveClass('opacity-70');
      expect(container.firstChild).toHaveClass('z-50', 'shadow-xl');
    });
  });
});
