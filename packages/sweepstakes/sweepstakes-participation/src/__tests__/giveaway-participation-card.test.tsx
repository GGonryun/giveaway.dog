import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveawayParticipationProps } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import { GiveawayParticipationCard } from '../giveaway-participation-card';
import {
  NOW,
  buildHost,
  buildParticipation,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from '@giveaway/sweepstakes-participation-core/testing/participation-fixtures';
import { DEFAULT_DESIGN_DATA } from '@giveaway/sweepstakes-model/defaults';
import type { DeviceType } from '@giveaway/sweepstakes-model/schemas';

const socialHost = buildHost({
  links: [
    { platform: 'x', url: 'https://x.com/acme' },
    { platform: 'discord', url: 'https://discord.gg/acme' }
  ]
});

const renderCard = (
  overrides: Partial<GiveawayParticipationProps> = {},
  device?: DeviceType
) =>
  renderWithParticipation(
    <GiveawayParticipationCard device={device}>
      <p>state content</p>
    </GiveawayParticipationCard>,
    { host: socialHost, ...overrides }
  );

describe('GiveawayParticipationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the children inside the card', () => {
    renderCard();
    expect(screen.getByText('state content')).toBeInTheDocument();
  });

  describe('timing row', () => {
    it('shows the date range, the time remaining and the total entries', () => {
      renderCard({ participation: buildParticipation({ totalEntries: 128 }) });
      expect(
        screen.getByText('Sep 24, 2026 - Oct 8, 2026')
      ).toBeInTheDocument();
      expect(screen.getByText('Ends in 7 days')).toBeInTheDocument();
      expect(screen.getByText('128 total entries')).toBeInTheDocument();
    });

    it('describes a scheduled giveaway by its start', () => {
      renderCard({
        sweepstakes: buildSweepstakes({
          status: 'SCHEDULED',
          timing: {
            startDate: new Date(2026, 9, 4, 12),
            endDate: new Date(2026, 9, 20, 12),
            timeZone: 'UTC'
          }
        })
      });
      expect(screen.getByText('Starts in 3 days')).toBeInTheDocument();
    });

    it('hides the date range on the mobile preview', () => {
      renderCard({}, 'mobile');
      expect(
        screen.getByText('Sep 24, 2026 - Oct 8, 2026').parentElement
      ).toHaveClass('hidden', 'sm:hidden');
    });

    it('shows the date range from the small breakpoint on desktop', () => {
      renderCard({}, 'desktop');
      const range = screen.getByText(
        'Sep 24, 2026 - Oct 8, 2026'
      ).parentElement;
      expect(range).toHaveClass('hidden', 'sm:flex');
      expect(range).not.toHaveClass('sm:hidden');
    });
  });

  describe('title', () => {
    it('shows the giveaway name and links the host to its giveaways', () => {
      renderCard();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Acme Games' })).toHaveAttribute(
        'href',
        '/browse?hosts=acme'
      );
    });

    it('links to the social profiles of the host in a new tab', () => {
      renderCard();
      const x = screen.getByRole('link', { name: 'X (Twitter)' });
      expect(x).toHaveAttribute('href', 'https://x.com/acme');
      expect(x).toHaveAttribute('target', '_blank');
      expect(x).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByRole('link', { name: 'Discord' })).toHaveAttribute(
        'href',
        'https://discord.gg/acme'
      );
    });

    it('ignores social links that are not valid', () => {
      renderCard({
        host: buildHost({ links: [{ platform: 'myspace', url: 'nope' }] })
      });
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('hides the title section when the name is not displayed', () => {
      renderCard({
        sweepstakes: buildSweepstakes({
          design: { ...DEFAULT_DESIGN_DATA, displayName: false }
        })
      });
      expect(
        screen.queryByRole('heading', { level: 1 })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Acme Games' })
      ).not.toBeInTheDocument();
    });
  });

  describe('banner', () => {
    it('shows the banner with a video aspect ratio', () => {
      renderCard();
      const banner = screen.getByRole('img', { name: 'Summer Giveaway' });
      expect(banner).toHaveAttribute(
        'src',
        'https://cdn.example.com/banner.png'
      );
      expect(banner.parentElement).toHaveClass('aspect-video');
    });

    it('keeps the natural aspect ratio when the design asks for none', () => {
      renderCard({
        sweepstakes: buildSweepstakes({
          design: { ...DEFAULT_DESIGN_DATA, aspectRatio: 'NONE' }
        })
      });
      expect(
        screen.getByRole('img', { name: 'Summer Giveaway' }).parentElement
      ).not.toHaveClass('aspect-video');
    });

    it('renders no image without a banner', () => {
      const base = buildSweepstakes();
      renderCard({
        sweepstakes: { ...base, setup: { ...base.setup, banner: '' } }
      });
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('renders the rich text description', () => {
      renderCard();
      expect(screen.getByText('Win a brand new headset!').tagName).toBe('P');
    });

    it('hides the description when it is not displayed', () => {
      renderCard({
        sweepstakes: buildSweepstakes({
          design: { ...DEFAULT_DESIGN_DATA, displayDescription: false }
        })
      });
      expect(
        screen.queryByText('Win a brand new headset!')
      ).not.toBeInTheDocument();
    });
  });

  describe('content theme', () => {
    it('uses a muted background for the profile form', () => {
      renderCard({ state: 'profile-incomplete' });
      expect(screen.getByText('state content').parentElement).toHaveClass(
        'bg-muted'
      );
    });

    it('uses the default background for other states', () => {
      renderCard({ state: 'active' });
      expect(screen.getByText('state content').parentElement).not.toHaveClass(
        'bg-muted'
      );
    });
  });

  describe('footer', () => {
    it('credits the host', () => {
      renderCard();
      expect(screen.getByText('© Acme Games')).toBeInTheDocument();
    });

    it('opens the terms and conditions', async () => {
      const user = userEvent.setup();
      renderCard();
      await user.click(
        screen.getByRole('button', { name: 'Terms & Conditions' })
      );
      expect(
        screen.getByRole('dialog', { name: 'Terms & Conditions' })
      ).toBeInTheDocument();
    });
  });
});
