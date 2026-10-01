import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WinnersPending } from '../winners-pending';

describe('WinnersPending', () => {
  it('matches the snapshot', () => {
    const { container } = render(<WinnersPending />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a warning alert that winners are being selected', () => {
    render(<WinnersPending />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Winners Being Selected');
    expect(alert).toHaveTextContent(
      'This giveaway has ended and winners are being selected.'
    );
    expect(alert).toHaveClass('text-warning');
  });
});
