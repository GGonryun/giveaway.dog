import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesAnalyticsSkeleton } from '../sweepstakes-analytics-skeleton';
import { SweepstakesEntriesSkeleton } from '../sweepstakes-entries-skeleton';
import { SweepstakesLoadingSkeleton } from '../sweepstakes-loading-skeleton';
import { SweepstakesParticipantsSkeleton } from '../sweepstakes-participants-skeleton';
import { SweepstakesWinnersSkeleton } from '../sweepstakes-winners-skeleton';

const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesAnalyticsSkeleton', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('matches the snapshot without the allocation chart', () => {
      const { container } = render(<SweepstakesAnalyticsSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot with the allocation chart', () => {
      const { container } = render(
        <SweepstakesAnalyticsSkeleton showAllocation />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('only shows the timeline by default', () => {
      render(<SweepstakesAnalyticsSkeleton />);
      expect(screen.getByText('Daily Entries Timeline')).toBeInTheDocument();
      expect(
        screen.getByText('Total entry volume over the last 7 days')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Prize Allocation Distribution')
      ).not.toBeInTheDocument();
    });

    it('adds the allocation chart when requested', () => {
      render(<SweepstakesAnalyticsSkeleton showAllocation />);
      expect(screen.getByText('Daily Entries Timeline')).toBeInTheDocument();
      expect(
        screen.getByText('Prize Allocation Distribution')
      ).toBeInTheDocument();
    });

    it('renders fourteen placeholder bars with random heights', () => {
      const { container } = render(<SweepstakesAnalyticsSkeleton />);
      const bars = container.querySelectorAll('.bg-muted.rounded-t');
      expect(bars).toHaveLength(14);
      expect(bars[0]).toHaveStyle({ height: '70%' });
    });
  });

  describe('SweepstakesEntriesSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesEntriesSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders the entries columns with ten placeholder rows', () => {
      render(<SweepstakesEntriesSkeleton />);
      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['Status', 'Task', 'Participant', 'Country', 'Updated']);
      expect(bodyRows()).toHaveLength(10);
    });
  });

  describe('SweepstakesParticipantsSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesParticipantsSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders the participant columns with ten placeholder rows', () => {
      render(<SweepstakesParticipantsSkeleton />);
      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['User', 'Last Entry', 'Quality', 'Engagement', 'Status', '']);
      expect(bodyRows()).toHaveLength(10);
    });
  });

  describe('SweepstakesWinnersSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesWinnersSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders three prize cards with two placeholder rows each', () => {
      render(<SweepstakesWinnersSkeleton />);
      expect(screen.getAllByRole('table')).toHaveLength(3);
      expect(screen.getAllByRole('row')).toHaveLength(3 * 3);
    });
  });

  describe('SweepstakesLoadingSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesLoadingSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders a status card and a preview card', () => {
      const { container } = render(<SweepstakesLoadingSkeleton />);
      expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(2);
      expect(container.querySelector('.aspect-video')).toBeInTheDocument();
    });
  });
});
