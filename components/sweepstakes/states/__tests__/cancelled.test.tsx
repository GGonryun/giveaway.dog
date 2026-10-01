import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cancelled } from '../cancelled';

describe('Cancelled', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Cancelled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('explains that the host cancelled the giveaway', () => {
    render(<Cancelled />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Giveaway Cancelled' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This giveaway has been cancelled by the host and is no longer available.'
      )
    ).toBeInTheDocument();
  });
});
