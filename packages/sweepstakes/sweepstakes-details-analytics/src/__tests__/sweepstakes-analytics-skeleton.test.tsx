import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesAnalyticsSkeleton } from '../sweepstakes-analytics-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesAnalyticsSkeleton', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
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
});
