import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesPageSkeleton } from '../sweepstakes-page-skeleton';

describe('SweepstakesPageSkeleton', () => {
  it('renders eight placeholder giveaway cards', () => {
    const { container } = render(<SweepstakesPageSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid?.children).toHaveLength(8);
  });

  it('renders placeholders for the search, filter and history controls', () => {
    const { container } = render(<SweepstakesPageSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      3 + 8 * 6
    );
  });
});
