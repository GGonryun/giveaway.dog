import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildParticipant,
  buildPrize,
  buildProvider,
  buildSweepstakes,
  buildUser,
  renderWithParticipation,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { ActiveParticipation } from '../active-participation';

const navigation = vi.hoisted(() => ({
  pathname: '/browse/summer-giveaway',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('@/components/auth/login-options', () => ({
  LoginOptions: () => <div data-testid="login-options" />
}));

vi.mock('@/lib/task/components/public-sweepstakes/task-list', () => ({
  TaskList: ({
    open,
    setOpen,
    setActiveTab
  }: {
    open: string | null;
    setOpen: (open: string | null) => void;
    setActiveTab: (tab: string) => void;
  }) => (
    <div data-testid="task-list">
      <span>open task: {open ?? 'none'}</span>
      <button onClick={() => setOpen('task-1')}>open first task</button>
      <button onClick={() => setActiveTab('prizes')}>show prizes</button>
    </div>
  )
}));

const connectedUser = buildUser({
  providers: [buildProvider({ type: 'TWITTER' })]
});

const prizes = [
  buildPrize({ id: 'prize-1', name: 'Gaming Headset', quota: 1 }),
  buildPrize({ id: 'prize-2', name: 'Gift Card', quota: 2 })
];

const setUrl = (search: string) => {
  navigation.searchParams = new URLSearchParams(search);
  window.history.replaceState(
    {},
    '',
    `${navigation.pathname}${search ? `?${search}` : ''}`
  );
};

const renderActive = (overrides: Partial<GiveawayParticipationProps> = {}) =>
  renderWithParticipation(<ActiveParticipation />, overrides);

describe('ActiveParticipation', () => {
  beforeEach(() => {
    setUrl('');
  });

  describe('snapshots', () => {
    it('matches the snapshot for a participant on the tasks tab', () => {
      const { container } = renderActive({
        participant: buildParticipant({
          completions: [buildCompletion()]
        })
      });
      expect(withStableIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot when winners are pending', () => {
      const { container } = renderActive({
        state: 'winners-pending',
        sweepstakes: buildSweepstakes({ prizes }),
        participant: buildParticipant({
          user: connectedUser,
          allocation: { prize: { id: 'prize-2', name: 'Gift Card' } }
        })
      });
      expect(withStableIds(container)).toMatchSnapshot();
    });
  });
});
