import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WinnerLeaderboardSchema } from '@/schemas/giveaway/winners';
import { WinnersLeaderboard } from '../winners-leaderboard';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/winners',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

type Win = WinnerLeaderboardSchema['wins'][number];

const createWin = (index: number, overrides: Partial<Win> = {}): Win => ({
  sweepstakesId: `sweepstakes-${index}`,
  sweepstakesName: `Giveaway ${index}`,
  sweepstakesSlug: `giveaway-${index}`,
  teamSlug: 'doggo-club',
  prizeName: null,
  wonAt: new Date('2026-01-15T12:00:00.000Z'),
  ...overrides
});

const createWinner = (
  index: number,
  overrides: Partial<WinnerLeaderboardSchema> = {}
): WinnerLeaderboardSchema => ({
  userId: `user-${index}`,
  userName: `Winner ${index}`,
  userImage: null,
  winCount: 1,
  wins: [createWin(index)],
  ...overrides
});

const ada = createWinner(1, {
  userName: 'Ada Lovelace',
  winCount: 3,
  wins: [
    createWin(1, {
      sweepstakesName: 'Summer Gear Giveaway',
      prizeName: 'Hiking backpack',
      wonAt: new Date('2026-03-02T12:00:00.000Z')
    }),
    createWin(2, {
      sweepstakesName: 'Winter Coffee Raffle',
      wonAt: new Date('2026-02-10T12:00:00.000Z')
    }),
    createWin(3, {
      sweepstakesName: 'Spring Book Bundle',
      prizeName: 'Ten novels',
      wonAt: new Date('2026-01-05T12:00:00.000Z')
    })
  ]
});

const anonymous = createWinner(2, {
  userName: null,
  winCount: 1,
  wins: [createWin(4, { sweepstakesName: 'Gaming Chair Draw' })]
});

const renderLeaderboard = ({
  winners = [ada, anonymous],
  currentPage = 1,
  currentSearch = ''
}: {
  winners?: WinnerLeaderboardSchema[];
  currentPage?: number;
  currentSearch?: string;
} = {}) =>
  render(
    <WinnersLeaderboard
      winners={winners}
      currentPage={currentPage}
      currentSearch={currentSearch}
    />
  );

const fullPage = Array.from({ length: 25 }, (_, index) =>
  createWinner(index + 1)
);

describe('WinnersLeaderboard', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/winners';
    navigation.searchParams = new URLSearchParams();
  });

  describe('when there are no winners', () => {
    it('shows an empty state without a table or pagination', () => {
      renderLeaderboard({ winners: [] });

      expect(screen.getByText('No winners to display yet')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('navigation', { name: 'pagination' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when there are winners', () => {
    it('ranks winners from the top of the first page', () => {
      renderLeaderboard();

      expect(
        screen.getByRole('row', { name: /Ada Lovelace/ })
      ).toHaveTextContent('#1');
      expect(
        screen.getByRole('row', { name: /Anonymous Winner/ })
      ).toHaveTextContent('#2');
    });

    it('continues the ranking on later pages', () => {
      renderLeaderboard({ currentPage: 2 });

      expect(
        screen.getByRole('row', { name: /Ada Lovelace/ })
      ).toHaveTextContent('#26');
    });

    it('shows the total number of wins', () => {
      renderLeaderboard();

      const [, , wins] = within(
        screen.getByRole('row', { name: /Ada Lovelace/ })
      ).getAllByRole('cell');
      expect(wins).toHaveTextContent('3');
    });

    it('shows the initial of the winner as the avatar fallback', () => {
      renderLeaderboard();

      const [, winner] = within(
        screen.getByRole('row', { name: /Ada Lovelace/ })
      ).getAllByRole('cell');
      expect(winner).toHaveTextContent('AAda Lovelace');
    });

    it('labels winners without a name as anonymous', () => {
      renderLeaderboard();

      const [, winner] = within(
        screen.getByRole('row', { name: /Anonymous Winner/ })
      ).getAllByRole('cell');
      expect(winner).toHaveTextContent('WAnonymous Winner');
    });

    it('links the most recent prize with its name and date', () => {
      renderLeaderboard();

      const link = screen.getByRole('link', { name: /Summer Gear Giveaway/ });
      expect(link).toHaveAttribute('href', '/browse/sweepstakes-1');
      expect(link).toHaveTextContent('Hiking backpack');
      expect(link).toHaveTextContent('Mar 2, 2026');
    });

    it('leaves the prize cell empty for a winner without wins', () => {
      renderLeaderboard({
        winners: [createWinner(3, { userName: 'Grace', wins: [] })]
      });

      const [, , , prizes] = within(
        screen.getByRole('row', { name: /Grace/ })
      ).getAllByRole('cell');
      expect(prizes).toBeEmptyDOMElement();
    });

    it('links to the active giveaways and the history', () => {
      renderLeaderboard();

      expect(
        screen.getByRole('link', { name: 'Active Giveaways' })
      ).toHaveAttribute('href', '/browse');
      expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
        'href',
        '/history'
      );
    });
  });

  describe('when expanding a winner', () => {
    it('only offers to expand winners with more than one prize', () => {
      renderLeaderboard();

      expect(
        within(screen.getByRole('row', { name: /Ada Lovelace/ })).getByRole(
          'button'
        )
      ).toBeInTheDocument();
      expect(
        within(
          screen.getByRole('row', { name: /Anonymous Winner/ })
        ).queryByRole('button')
      ).not.toBeInTheDocument();
    });

    it('lists every prize the winner has won', async () => {
      const user = userEvent.setup();
      renderLeaderboard();

      await user.click(
        within(screen.getByRole('row', { name: /Ada Lovelace/ })).getByRole(
          'button'
        )
      );

      const prizes = screen.getByText('All Prizes').parentElement;
      if (!prizes) throw new Error('Prize list not found');
      expect(
        within(prizes)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href'))
      ).toEqual([
        '/browse/sweepstakes-1',
        '/browse/sweepstakes-2',
        '/browse/sweepstakes-3'
      ]);
      expect(prizes).toHaveTextContent('Ten novels');
      expect(prizes).toHaveTextContent('Jan 5, 2026');
    });

    it('collapses the prizes when toggled again', async () => {
      const user = userEvent.setup();
      renderLeaderboard();
      const toggle = within(
        screen.getByRole('row', { name: /Ada Lovelace/ })
      ).getByRole('button');

      await user.click(toggle);
      await user.click(toggle);

      expect(screen.queryByText('All Prizes')).not.toBeInTheDocument();
    });
  });

  describe('when searching', () => {
    it('shows the current search', () => {
      renderLeaderboard({ currentSearch: 'ada' });

      expect(screen.getByRole('searchbox')).toHaveValue('ada');
    });

    it('navigates with the search term and resets the page', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('page=3&sort=recent');
      renderLeaderboard();

      await user.type(screen.getByRole('searchbox'), 'ada');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/winners?sort=recent&search=ada'
      );
    });

    it('removes the search param when an empty search is submitted', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('search=ada&sort=recent');
      renderLeaderboard({ currentSearch: 'ada' });

      await user.clear(screen.getByRole('searchbox'));
      await user.click(screen.getByRole('button', { name: 'Search' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/winners?sort=recent'
      );
    });

    it('navigates to the bare path when the search is cleared', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('search=ada&page=2');
      renderLeaderboard({ currentSearch: 'ada' });

      const search = screen.getByRole('searchbox').parentElement;
      if (!search) throw new Error('Search box not found');
      await user.click(
        within(search)
          .getAllByRole('button')
          .filter((button) => button.textContent === '')[0]
      );

      expect(navigation.router.push).toHaveBeenCalledWith('/winners');
    });
  });

  describe('pagination', () => {
    it('disables the previous page on the first page', () => {
      renderLeaderboard();

      const previous = screen.getByRole('link', {
        name: 'Go to previous page'
      });
      expect(previous).toHaveAttribute('aria-disabled', 'true');
      expect(previous).toHaveAttribute('href', '#');
    });

    it('links to the previous page on later pages', () => {
      navigation.searchParams = new URLSearchParams('page=3&search=ada');
      renderLeaderboard({ currentPage: 3 });

      expect(
        screen.getByRole('link', { name: 'Go to previous page' })
      ).toHaveAttribute('href', '/winners?page=2&search=ada');
    });

    it('disables the next page when the page is not full', () => {
      renderLeaderboard();

      const next = screen.getByRole('link', { name: 'Go to next page' });
      expect(next).toHaveAttribute('aria-disabled', 'true');
      expect(next).toHaveAttribute('href', '#');
    });

    it('links to the next page when the page is full', () => {
      renderLeaderboard({ winners: fullPage });

      const next = screen.getByRole('link', { name: 'Go to next page' });
      expect(next).toHaveAttribute('aria-disabled', 'false');
      expect(next).toHaveAttribute('href', '/winners?page=2');
    });

    it('marks the current page', () => {
      renderLeaderboard({ currentPage: 4 });

      expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(
        '4'
      );
    });
  });
});
