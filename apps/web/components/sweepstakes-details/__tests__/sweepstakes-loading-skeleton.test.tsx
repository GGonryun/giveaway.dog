import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SweepstakesLoadingSkeleton } from '../sweepstakes-loading-skeleton';

describe('sweepstakes details skeletons', () => {
  describe('SweepstakesLoadingSkeleton', () => {
    it('renders a status card and a preview card', () => {
      const { container } = render(<SweepstakesLoadingSkeleton />);
      expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(2);
      expect(container.querySelector('.aspect-video')).toBeInTheDocument();
    });
  });
});
