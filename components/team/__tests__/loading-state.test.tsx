import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from '../loading-state';

describe('LoadingState', () => {
  it('shows the given text', () => {
    render(<LoadingState text="Switching to team..." />);

    expect(screen.getByText('Switching to team...')).toBeInTheDocument();
  });

  it('renders a spinning loader above the text', () => {
    const { container } = render(<LoadingState text="Loading teams..." />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner?.nextElementSibling).toHaveTextContent('Loading teams...');
  });
});
