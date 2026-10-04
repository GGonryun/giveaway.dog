import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAROUSEL_PLATFORMS,
  getPlatformLabel
} from '@giveaway/platform-catalog/platform-icons';
import { SocialPlatformsCarousel } from '../social-platforms-carousel';

const themeState = vi.hoisted(() => ({
  resolvedTheme: undefined as string | undefined
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: themeState.resolvedTheme })
}));

const githubIconSources = () =>
  screen
    .getAllByRole('img', { name: getPlatformLabel('github') })
    .map((image) => image.getAttribute('src'));

describe('SocialPlatformsCarousel', () => {
  beforeEach(() => {
    themeState.resolvedTheme = undefined;
  });

  it('renders a carousel region', () => {
    render(<SocialPlatformsCarousel initialTheme="light" />);
    expect(screen.getByRole('region')).toHaveAttribute(
      'aria-roledescription',
      'carousel'
    );
  });

  it('repeats every platform twice so the loop has no gaps', () => {
    render(<SocialPlatformsCarousel initialTheme="light" />);
    expect(screen.getAllByRole('link')).toHaveLength(
      CAROUSEL_PLATFORMS.length * 2
    );
  });

  it('links each platform to its integration guide', () => {
    render(<SocialPlatformsCarousel initialTheme="light" />);
    const links = screen.getAllByRole('link', {
      name: getPlatformLabel('bluesky')
    });
    expect(links).toHaveLength(2);
    links.forEach((link) =>
      expect(link).toHaveAttribute('href', '/learn/integrations/bluesky')
    );
  });

  it('uses the server theme until the client theme is known', () => {
    render(<SocialPlatformsCarousel initialTheme="dark" />);
    expect(githubIconSources()).toEqual([
      '/platforms/github-white.svg',
      '/platforms/github-white.svg'
    ]);
  });

  it('switches to the resolved client theme', () => {
    themeState.resolvedTheme = 'light';
    render(<SocialPlatformsCarousel initialTheme="dark" />);
    expect(githubIconSources()).toEqual([
      '/platforms/github.svg',
      '/platforms/github.svg'
    ]);
  });

  it('uses dark icons for a dark client theme', () => {
    themeState.resolvedTheme = 'dark';
    render(<SocialPlatformsCarousel initialTheme="light" />);
    expect(githubIconSources()[0]).toBe('/platforms/github-white.svg');
  });

  it('ignores an unexpected client theme', () => {
    themeState.resolvedTheme = 'sepia';
    render(<SocialPlatformsCarousel initialTheme="dark" />);
    expect(githubIconSources()[0]).toBe('/platforms/github-white.svg');
  });

  it('shows the platform name in a tooltip on hover', async () => {
    render(<SocialPlatformsCarousel initialTheme="light" />);
    await userEvent.hover(
      screen.getAllByRole('link', { name: getPlatformLabel('twitch') })[0]
    );
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      getPlatformLabel('twitch')
    );
  });
});
