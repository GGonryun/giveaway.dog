import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hero } from '../hero';

const mocks = vi.hoisted(() => ({
  getServerTheme: vi.fn()
}));

vi.mock('@giveaway/theme-server/get-server-theme', () => ({
  getServerTheme: mocks.getServerTheme
}));

vi.mock('@giveaway/marketing-ui/social-platforms-carousel', () => ({
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

  it('matches the snapshot', async () => {
    const { container } = await renderHero();
    expect(container.firstChild).toMatchSnapshot();
  });
});
