import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WinnerLeaderboardSchema } from '@giveaway/leaderboard-model/winners';
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

describe('WinnersLeaderboard', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/winners';
    navigation.searchParams = new URLSearchParams();
  });

  describe('when there are no winners', () => {
    it('matches the snapshot', () => {
      const { container } = renderLeaderboard({ winners: [] });

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when there are winners', () => {
    it('matches the snapshot', () => {
      const { container } = renderLeaderboard();

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
