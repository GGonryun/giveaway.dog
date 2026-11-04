import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SweepstakesFilterBar } from '../sweepstakes-filter-bar';

vi.mock('@giveaway/sweepstakes-routes/use-sweepstakes-page', () => ({
  useSweepstakesPage: () => ({ updateParams: vi.fn() })
}));

describe('SweepstakesFilterBar', () => {
  it('names the date range select', () => {
    render(<SweepstakesFilterBar filters={{ dateRange: 'all' }} />);

    expect(
      screen.getByRole('combobox', { name: 'Date range' })
    ).toBeInTheDocument();
  });
});
