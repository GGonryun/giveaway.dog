import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesLoadingSkeleton } from '../sweepstakes-loading-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesLoadingSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesLoadingSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
