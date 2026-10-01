import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HostCTA } from '../host-cta';

describe('HostCTA', () => {
  it('matches the snapshot', () => {
    const { container } = render(<HostCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('pitches hosting a giveaway', () => {
    render(<HostCTA />);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Ready to host your own giveaway?'
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    ).toEqual(['Grow Your Audience', 'Easy Setup', 'Track Results']);
  });

  it('links to the app and the demo', () => {
    render(<HostCTA />);
    expect(
      screen.getByRole('link', { name: 'Start Your Giveaway' })
    ).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: 'Try The Demo' })).toHaveAttribute(
      'href',
      '/demo/sweepstakes'
    );
  });
});
