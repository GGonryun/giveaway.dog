import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesEntriesSkeleton } from '../sweepstakes-entries-skeleton';

const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesEntriesSkeleton', () => {
    it('renders the entries columns with ten placeholder rows', () => {
      render(<SweepstakesEntriesSkeleton />);
      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['Status', 'Task', 'Participant', 'Country', 'Updated']);
      expect(bodyRows()).toHaveLength(10);
    });
  });
});
