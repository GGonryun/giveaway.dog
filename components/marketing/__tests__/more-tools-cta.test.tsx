import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MorePowerfulGiveawaysCTA, MoreToolsCTA } from '../more-tools-cta';

describe('MorePowerfulGiveawaysCTA', () => {
  it('pitches full giveaway campaigns', () => {
    render(<MorePowerfulGiveawaysCTA />);
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Need More Powerful Giveaways?'
      })
    ).toBeInTheDocument();
  });

  it('links to the sweepstakes demo', () => {
    render(<MorePowerfulGiveawaysCTA />);
    expect(
      screen.getByRole('link', { name: 'Get Started - Free' })
    ).toHaveAttribute('href', '/demo/sweepstakes');
  });

  it('links to the giveaway examples', () => {
    render(<MorePowerfulGiveawaysCTA />);
    expect(
      screen.getByRole('link', { name: 'Browse Examples' })
    ).toHaveAttribute('href', '/browse');
  });

  it('matches the snapshot', () => {
    const { container } = render(<MorePowerfulGiveawaysCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('MoreToolsCTA', () => {
  it('links to the full list of tools', () => {
    render(<MoreToolsCTA />);
    expect(screen.getByText('Looking for more tools?')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View All Tools' })
    ).toHaveAttribute('href', '/tools');
  });

  it('matches the snapshot', () => {
    const { container } = render(<MoreToolsCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
