import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesAnalyticsSkeleton } from '../sweepstakes-analytics-skeleton';
import { SweepstakesEntriesSkeleton } from '../sweepstakes-entries-skeleton';
import { SweepstakesLoadingSkeleton } from '../sweepstakes-loading-skeleton';
import { SweepstakesParticipantsSkeleton } from '../sweepstakes-participants-skeleton';
import { SweepstakesWinnersSkeleton } from '../sweepstakes-winners-skeleton';

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
  });

  describe('SweepstakesEntriesSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesEntriesSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('SweepstakesParticipantsSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesParticipantsSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('SweepstakesWinnersSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesWinnersSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('SweepstakesLoadingSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesLoadingSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
