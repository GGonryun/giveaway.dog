import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_SOCIAL_PLATFORMS,
  type SocialPlatform
} from '@/schemas/social-links';
import { PLATFORM_ICONS, SocialLinkIcon } from '../social-link-icon';

const expectedLabels: Record<SocialPlatform, string> = {
  x: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  discord: 'Discord',
  reddit: 'Reddit',
  youtube: 'YouTube',
  twitch: 'Twitch',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  website: 'Website'
};

describe('SocialLinkIcon', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <SocialLinkIcon platform="discord" url="https://discord.gg/doggo" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it.each(SUPPORTED_SOCIAL_PLATFORMS)(
    'renders an accessible external link for %s',
    (platform) => {
      render(
        <SocialLinkIcon
          platform={platform}
          url={`https://example.com/${platform}`}
        />
      );

      const link = screen.getByRole('link', {
        name: expectedLabels[platform]
      });
      expect(link).toHaveAttribute('href', `https://example.com/${platform}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link.querySelector('svg')).toBeInTheDocument();
    }
  );

  it.each([
    ['sm', ['h-4', 'w-4']],
    ['md', ['h-5', 'w-5']],
    ['lg', ['h-6', 'w-6']]
  ] as const)('sizes the icon for the %s size', (size, classes) => {
    render(
      <SocialLinkIcon platform="website" url="https://doggo.club" size={size} />
    );

    expect(
      screen.getByRole('link', { name: 'Website' }).querySelector('svg')
    ).toHaveClass(...classes);
  });

  it('uses the medium icon size by default', () => {
    render(<SocialLinkIcon platform="website" url="https://doggo.club" />);

    expect(
      screen.getByRole('link', { name: 'Website' }).querySelector('svg')
    ).toHaveClass('h-5', 'w-5');
  });

  it('renders a round ghost icon button by default', () => {
    render(<SocialLinkIcon platform="x" url="https://x.com/doggo" />);

    const link = screen.getByRole('link', { name: 'X (Twitter)' });
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveClass('rounded-full', 'hover:bg-accent');
  });

  it('applies the outline variant and a custom class name', () => {
    render(
      <SocialLinkIcon
        platform="x"
        url="https://x.com/doggo"
        variant="outline"
        className="shadow-none"
      />
    );

    expect(screen.getByRole('link', { name: 'X (Twitter)' })).toHaveClass(
      'border',
      'rounded-full',
      'shadow-none'
    );
  });
});

describe('PLATFORM_ICONS', () => {
  it('has an icon and label for every supported platform', () => {
    expect(Object.keys(PLATFORM_ICONS).sort()).toEqual(
      [...SUPPORTED_SOCIAL_PLATFORMS].sort()
    );
  });
});
