import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesWinnersSkeleton } from '../sweepstakes-winners-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesWinnersSkeleton', () => {
    it('renders three prize cards with two placeholder rows each', () => {
      render(<SweepstakesWinnersSkeleton />);
      expect(screen.getAllByRole('table')).toHaveLength(3);
      expect(screen.getAllByRole('row')).toHaveLength(3 * 3);
    });
  });
});
