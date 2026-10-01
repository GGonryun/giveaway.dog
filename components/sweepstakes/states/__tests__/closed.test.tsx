import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Closed } from '../closed';

describe('Closed', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Closed />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('tells the visitor that entries are not accepted', () => {
    render(<Closed />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Giveaway Closed' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('This giveaway is not accepting entries.')
    ).toBeInTheDocument();
  });
});
