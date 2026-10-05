import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesParticipantsSkeleton } from '../sweepstakes-participants-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesParticipantsSkeleton', () => {
    it('matches the snapshot', () => {
      const { container } = render(<SweepstakesParticipantsSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
