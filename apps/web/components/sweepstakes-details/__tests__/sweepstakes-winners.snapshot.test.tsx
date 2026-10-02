import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@/components/context/team-provider';
import {
  NOW,
  buildCompletion,
  buildCriteria,
  buildParticipant,
  buildSweepstakesPrize,
  buildSweepstakesPrizeDraw,
  buildTask,
  buildTeam,
  buildUser,
  buildUserProfile,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { SweepstakesWinners } from '../sweepstakes-winners';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/winners/procedures/roll-prizes', () => ({
  rollPrizes: vi.fn()
}));
vi.mock('@/lib/winners/procedures/roll-prize', () => ({ rollPrize: vi.fn() }));
vi.mock('@/lib/winners/procedures/reroll-draw', () => ({
  rerollDraw: vi.fn()
}));
vi.mock('@/lib/winners/procedures/disqualify-draw', () => ({
  disqualifyDraw: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/complete-sweepstakes', () => ({
  default: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/update-winner-criteria', () => ({
  default: vi.fn()
}));

const DAY = 24 * 60 * 60 * 1000;
const ENDED = new Date(NOW.getTime() - DAY);

const wendy = buildUserProfile({
  id: 'user-1',
  name: 'Wendy Winner',
  email: 'wendy@example.com',
  qualityScore: 95
});
const chad = buildUserProfile({
  id: 'user-2',
  name: 'Chad Cheater',
  email: 'chad@example.com',
  qualityScore: 20
});

const winnerDraw = buildSweepstakesPrizeDraw({
  id: 'draw-1',
  participant: wendy,
  createdAt: new Date(2026, 9, 9, 10, 0),
  taskCompletion: buildCompletion({
    id: 'c-1',
    task: buildTask({ id: 'task-1', title: 'Say hello' })
  })
});

const disqualifiedDraw = buildSweepstakesPrizeDraw({
  id: 'draw-2',
  participant: chad,
  result: 'DISQUALIFIED',
  disqualificationReason: 'Bot activity',
  createdAt: new Date(2026, 9, 9, 9, 0),
  taskCompletion: buildCompletion({
    id: 'c-2',
    task: buildTask({ id: 'task-2', title: 'Visit our site' })
  })
});

const headset = buildSweepstakesPrize({
  id: 'prize-1',
  name: 'Gaming Headset',
  quota: 2,
  draws: [winnerDraw, disqualifiedDraw]
});

const giftCard = buildSweepstakesPrize({
  id: 'prize-2',
  name: 'Gift Card',
  position: 1,
  quota: 1,
  draws: []
});

const completion = buildCompletion();

const participants = [
  buildParticipant({
    id: 'participant-1',
    user: buildUser({ id: 'user-1', qualityScore: 95 }),
    completions: [completion, completion]
  }),
  buildParticipant({
    id: 'participant-2',
    user: buildUser({ id: 'user-2', qualityScore: 20 }),
    completions: [completion]
  }),
  buildParticipant({
    id: 'participant-3',
    user: buildUser({ id: 'user-3', qualityScore: 70 }),
    completions: []
  }),
  buildParticipant({
    id: 'participant-4',
    user: buildUser({ id: 'user-4', qualityScore: 60 }),
    completions: [completion]
  })
];

type WinnersProps = ComponentProps<typeof SweepstakesWinners>;

const team = buildTeam();

const renderWinners = (props: Partial<WinnersProps> = {}) =>
  render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <SweepstakesWinners
        prizes={[headset, giftCard]}
        participants={participants}
        sweepstakesId="sweep-1"
        slug="acme"
        status="EXPIRED"
        endDate={ENDED}
        criteria={buildCriteria({ minTasksCompleted: 1, minQualityScore: 50 })}
        {...props}
      />
    </TeamsProvider>
  );

describe('SweepstakesWinners', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot with partially picked winners', () => {
    const { container } = renderWinners();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
