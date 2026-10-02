import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildGiveawayPrize,
  buildParticipant,
  buildPrizeDraw,
  buildSweepstakes,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { WinnersAnnouncedParticipation } from '../winners-announced-participation';

const navigation = vi.hoisted(() => ({
  pathname: '/browse/summer-giveaway',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('@/lib/task/components/public-sweepstakes/task-list', () => ({
  TaskList: ({
    open,
    setOpen
  }: {
    open: string | null;
    setOpen: (open: string | null) => void;
  }) => (
    <div data-testid="task-list">
      <span>open task: {open ?? 'none'}</span>
      <button onClick={() => setOpen('task-2')}>open second task</button>
    </div>
  )
}));

const setUrl = (search: string) => {
  navigation.searchParams = new URLSearchParams(search);
  window.history.replaceState(
    {},
    '',
    `${navigation.pathname}${search ? `?${search}` : ''}`
  );
};

const renderParticipation = (
  overrides: Partial<GiveawayParticipationProps> = {}
) =>
  renderWithParticipation(<WinnersAnnouncedParticipation />, {
    state: 'winners-announced',
    sweepstakes: buildSweepstakes({ status: 'COMPLETED' }),
    prizes: [buildGiveawayPrize({ draws: [buildPrizeDraw()] })],
    ...overrides
  });

describe('WinnersAnnouncedParticipation', () => {
  beforeEach(() => {
    setUrl('');
  });

  it('matches the snapshot', () => {
    const { container } = renderParticipation({
      participant: buildParticipant({ completions: [buildCompletion()] })
    });
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
