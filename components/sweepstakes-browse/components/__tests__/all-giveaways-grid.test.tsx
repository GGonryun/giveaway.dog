import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildPublicSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import { AllGiveawaysGrid } from '../all-giveaways-grid';

const summer = buildPublicSweepstakes();
const winter = buildPublicSweepstakes({
  id: 'sweep-2',
  slug: 'winter-raffle',
  name: 'Winter Raffle'
});

describe('AllGiveawaysGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('explains that no giveaways were found', () => {
    render(<AllGiveawaysGrid sweepstakes={[]} participation={{}} />);
    expect(
      screen.getByRole('heading', { name: 'No giveaways found' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Try adjusting your search or filters to find more giveaways.'
      )
    ).toBeInTheDocument();
  });

  it('renders a card for every giveaway', () => {
    render(
      <AllGiveawaysGrid sweepstakes={[summer, winter]} participation={{}} />
    );
    expect(screen.getByText('Showing 2 giveaways')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    ).toEqual(['/browse/summer-giveaway', '/browse/winter-raffle']);
  });

  it('uses the singular for a single giveaway', () => {
    render(<AllGiveawaysGrid sweepstakes={[summer]} participation={{}} />);
    expect(screen.getByText('Showing 1 giveaway')).toBeInTheDocument();
  });

  it('passes the participation of each giveaway to its card', () => {
    render(
      <AllGiveawaysGrid
        sweepstakes={[summer, winter]}
        participation={{
          'sweep-2': { sweepstakesId: 'sweep-2', completed: 1, maximum: 3 }
        }}
      />
    );
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  describe('when entered giveaways are hidden', () => {
    it('only shows giveaways without participation', () => {
      render(
        <AllGiveawaysGrid
          hideEntered
          sweepstakes={[summer, winter]}
          participation={{
            'sweep-1': { sweepstakesId: 'sweep-1', completed: 1, maximum: 3 }
          }}
        />
      );
      expect(screen.getByText('Showing 1 giveaway')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Winter Raffle' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Summer Giveaway' })
      ).not.toBeInTheDocument();
    });

    it('shows the empty state when every giveaway was entered', () => {
      render(
        <AllGiveawaysGrid
          hideEntered
          sweepstakes={[summer]}
          participation={{
            'sweep-1': { sweepstakesId: 'sweep-1', completed: 0, maximum: 3 }
          }}
        />
      );
      expect(
        screen.getByRole('heading', { name: 'No giveaways found' })
      ).toBeInTheDocument();
    });
  });
});
