import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder with the data-slot attribute', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-accent');
    expect(skeleton).toBeEmptyDOMElement();
  });

  it('lets a custom class name override the default radius', () => {
    render(<Skeleton data-testid="skeleton" className="rounded-full" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');
    expect(skeleton).not.toHaveClass('rounded-md');
  });

  it('forwards accessibility props', () => {
    render(<Skeleton role="status" aria-label="Loading entries" />);
    expect(
      screen.getByRole('status', { name: 'Loading entries' })
    ).toBeInTheDocument();
  });
});
