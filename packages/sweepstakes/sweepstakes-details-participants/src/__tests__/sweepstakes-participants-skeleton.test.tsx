import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesParticipantsSkeleton } from '../sweepstakes-participants-skeleton';

const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesParticipantsSkeleton', () => {
    it('renders the participant columns with ten placeholder rows', () => {
      render(<SweepstakesParticipantsSkeleton />);
      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['User', 'Last Entry', 'Quality', 'Engagement', 'Status', '']);
      expect(bodyRows()).toHaveLength(10);
    });
  });
});
