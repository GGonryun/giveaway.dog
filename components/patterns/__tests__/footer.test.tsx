import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BLUESKY_PROFILE_URL,
  FACEBOOK_PROFILE_URL,
  TWITTER_PROFILE_URL
} from '@/lib/settings';
import { Footer } from '../footer';

describe('Footer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a copyright notice for the current year', () => {
    render(<Footer />);
    expect(
      screen.getByText('© 2026 Giveaway.dog. All rights reserved.')
    ).toBeInTheDocument();
  });

  it('updates the copyright year as time passes', () => {
    vi.setSystemTime(new Date('2031-01-01T00:00:00Z'));
    render(<Footer />);
    expect(
      screen.getByText('© 2031 Giveaway.dog. All rights reserved.')
    ).toBeInTheDocument();
  });

  it.each([
    ['Facebook', FACEBOOK_PROFILE_URL],
    ['Twitter', TWITTER_PROFILE_URL],
    ['Bluesky', BLUESKY_PROFILE_URL]
  ])('links to the %s profile in a new tab', (label, href) => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: label });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to the legal pages', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('uses custom links and copyright', () => {
    render(
      <Footer
        copyright="© Acme"
        socialLinks={[
          {
            icon: <span>yt</span>,
            href: 'https://youtube.com/@acme',
            label: 'YouTube'
          }
        ]}
        legalLinks={[{ name: 'Cookies', href: '/cookies' }]}
      />
    );
    expect(screen.getByText('© Acme')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
      'href',
      'https://youtube.com/@acme'
    );
    expect(screen.getByRole('link', { name: 'Cookies' })).toHaveAttribute(
      'href',
      '/cookies'
    );
    expect(
      screen.queryByRole('link', { name: 'Terms' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Facebook' })
    ).not.toBeInTheDocument();
  });

  it('matches the snapshot', () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
