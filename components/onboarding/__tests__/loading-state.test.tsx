import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from '../loading-state';

describe('LoadingState', () => {
  it('matches the snapshot', () => {
    const { container } = render(<LoadingState />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('shows a generic loading message by default', () => {
    render(<LoadingState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the given text', () => {
    render(<LoadingState text="Setting up your profile..." />);

    expect(screen.getByText('Setting up your profile...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders a spinning loader', () => {
    const { container } = render(<LoadingState />);

    expect(container.querySelector('svg')).toHaveClass('animate-spin');
  });
});
