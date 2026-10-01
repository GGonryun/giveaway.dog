import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IncompleteGiveawaySetup } from '../empty-states';

describe('IncompleteGiveawaySetup', () => {
  it('matches the snapshot', () => {
    const { container } = render(<IncompleteGiveawaySetup />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('lists the setup steps needed before a preview is available', () => {
    render(<IncompleteGiveawaySetup />);
    expect(
      screen.getByRole('heading', { name: 'Setup Your Giveaway' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Complete the Setup step to see your giveaway preview.')
    ).toBeInTheDocument();
    [
      '• Add a giveaway name',
      '• Set start and end dates',
      '• Configure entry methods',
      '• Add prizes'
    ].forEach((step) => expect(screen.getByText(step)).toBeInTheDocument());
  });
});
