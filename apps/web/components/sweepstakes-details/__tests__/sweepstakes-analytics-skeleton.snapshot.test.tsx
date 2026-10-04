import { render } from '@testing-library/react';
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
});
