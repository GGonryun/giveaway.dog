import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesWinnersSkeleton } from '../sweepstakes-winners-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesWinnersSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesWinnersSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
