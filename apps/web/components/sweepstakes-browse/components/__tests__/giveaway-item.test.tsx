import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildPublicSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import type { PublicSweepstakesParticipationSchema } from '@giveaway/participant-model/schemas';
import type { PublicSweepstakeSchema } from '@giveaway/sweepstakes-model/public';
import { GiveawayItem } from '../giveaway-item';

const DAY = 24 * 60 * 60 * 1000;
const fromNow = (ms: number) => new Date(NOW.getTime() + ms);

const renderItem = (
  overrides: Partial<PublicSweepstakeSchema> = {},
  participation?: PublicSweepstakesParticipationSchema[string]
) =>
  render(
    <GiveawayItem
      sweepstakes={buildPublicSweepstakes(overrides)}
      participation={participation}
    />
  );

describe('GiveawayItem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('links to the giveaway by its slug', () => {
    renderItem();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/browse/summer-giveaway'
    );
  });

  it('links to the giveaway by its id when it has no slug', () => {
    renderItem({ slug: undefined });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/browse/sweep-1');
  });

  it('shows the banner with the giveaway name as alt text', () => {
    renderItem();
    expect(
      screen.getByRole('img', { name: 'Summer Giveaway' })
    ).toHaveAttribute('src', 'https://cdn.example.com/banner.png');
  });

  it('renders no image without a banner', () => {
    renderItem({ banner: undefined });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the name as a heading', () => {
    renderItem();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Summer Giveaway' })
    ).toBeInTheDocument();
  });

  describe('timing', () => {
    it('shows the time left of a running giveaway', () => {
      renderItem();
      expect(
        screen.getByText('7 days left • by Acme Games')
      ).toBeInTheDocument();
    });

    it('shows how long ago an ended giveaway finished and dims it', () => {
      const { container } = renderItem({
        status: 'EXPIRED',
        startDate: fromNow(-10 * DAY),
        endDate: fromNow(-3 * DAY)
      });
      expect(
        screen.getByText('3 days ago • by Acme Games')
      ).toBeInTheDocument();
      expect(container.querySelector('[data-slot="card"]')).toHaveClass(
        'opacity-75'
      );
    });

    it('shows when an upcoming giveaway starts', () => {
      renderItem({
        status: 'SCHEDULED',
        startDate: fromNow(3 * DAY),
        endDate: fromNow(10 * DAY)
      });
      expect(
        screen.getByText('Starts in 3 days • by Acme Games')
      ).toBeInTheDocument();
    });

    it('does not dim a running giveaway', () => {
      const { container } = renderItem();
      expect(container.querySelector('[data-slot="card"]')).not.toHaveClass(
        'opacity-75'
      );
    });
  });

  describe('badges', () => {
    it('shows the status summary badge', () => {
      renderItem({ endDate: fromNow(2 * DAY) });
      expect(screen.getByText('Ending')).toBeInTheDocument();
    });

    it('shows a featured badge', () => {
      renderItem({ featured: true });
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not show a featured badge for regular giveaways', () => {
      renderItem({ featured: false });
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('shows partial participation as a fraction', () => {
      renderItem({}, { sweepstakesId: 'sweep-1', completed: 2, maximum: 5 });
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    it('shows Done when every task is completed', () => {
      renderItem({}, { sweepstakesId: 'sweep-1', completed: 5, maximum: 5 });
      const badge = screen.getByText('Done');
      expect(badge).toHaveClass('bg-green-700');
      expect(screen.queryByText('5/5')).not.toBeInTheDocument();
    });

    it('does not show participation without completed tasks', () => {
      renderItem({}, { sweepstakesId: 'sweep-1', completed: 0, maximum: 5 });
      expect(screen.queryByText('0/5')).not.toBeInTheDocument();
    });
  });
});
