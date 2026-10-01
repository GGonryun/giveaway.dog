import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesPageSkeleton } from '../sweepstakes-page-skeleton';

describe('SweepstakesPageSkeleton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<SweepstakesPageSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
