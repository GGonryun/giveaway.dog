import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesEntriesSkeleton } from '../sweepstakes-entries-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesEntriesSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesEntriesSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
