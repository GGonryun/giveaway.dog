import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Error as ErrorState } from '../error';

describe('Error', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ErrorState />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('asks the visitor to refresh the page', () => {
    render(<ErrorState />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Something went wrong' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please try refreshing the page\./)
    ).toBeInTheDocument();
  });
});
