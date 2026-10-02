import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hero } from '../hero';

const mocks = vi.hoisted(() => ({
  getServerTheme: vi.fn()
}));

vi.mock('@/lib/theme/get-server-theme', () => ({
  getServerTheme: mocks.getServerTheme
}));

vi.mock('../social-platforms-carousel', () => ({
  SocialPlatformsCarousel: ({ initialTheme }: { initialTheme: string }) => (
    <div>Platforms carousel ({initialTheme})</div>
  )
}));

vi.mock('../hero-sweepstakes-preview', () => ({
  HeroSweepstakesPreview: () => <div>Sweepstakes preview</div>
}));

const renderHero = async () => render(await Hero());

describe('Hero', () => {
  beforeEach(() => {
    mocks.getServerTheme.mockReset();
    mocks.getServerTheme.mockResolvedValue('dark');
  });

  it('pitches how creators build bigger communities', async () => {
    await renderHero();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How creators build bigger communities'
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Host verified giveaways in under 60 seconds that grow your community without bots or spam.'
      )
    ).toBeInTheDocument();
  });

  it('links to the giveaways and the free demo', async () => {
    await renderHero();
    expect(screen.getByRole('link', { name: 'Giveaways' })).toHaveAttribute(
      'href',
      '/browse'
    );
    expect(
      screen.getByRole('link', { name: 'Try it for free' })
    ).toHaveAttribute('href', '/demo/sweepstakes');
  });

  it('shows the hosts that chose Giveaway.dog', async () => {
    await renderHero();
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(
      screen.getByText(/giveaway hosts/).textContent?.replace(/\s+/g, ' ')
    ).toBe('Chosen by over 30 giveaway hosts');
  });

  it.each(['dark', 'light'])(
    'passes the %s server theme to the platforms carousel',
    async (theme) => {
      mocks.getServerTheme.mockResolvedValue(theme);
      await renderHero();
      expect(
        screen.getByText(`Platforms carousel (${theme})`)
      ).toBeInTheDocument();
    }
  );

  it('shows the sweepstakes preview', async () => {
    await renderHero();
    expect(screen.getByText('Sweepstakes preview')).toBeInTheDocument();
  });
});
