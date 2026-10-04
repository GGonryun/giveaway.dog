import { act, render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildCompletion,
  buildCriteria,
  buildParticipant,
  buildSweepstakesPrize,
  buildSweepstakesPrizeDraw,
  buildUser,
  buildUserProfile
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { PublicWinnerDraw } from '../public-winner-draw';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className
    }: {
      children?: ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>
  }
}));

vi.mock('@/lib/winners/procedures/roll-prizes', () => ({
  rollPrizes: vi.fn()
}));

const wendy = buildUserProfile({ id: 'user-1', name: 'Wendy Winner' });

const winnerDraw = (id: string, participant = wendy) =>
  buildSweepstakesPrizeDraw({ id, participant });

const headset = (draws = [winnerDraw('draw-1')]) =>
  buildSweepstakesPrize({
    id: 'prize-1',
    name: 'Gaming Headset',
    quota: 2,
    draws
  });

const giftCard = buildSweepstakesPrize({
  id: 'prize-2',
  name: 'Gift Card',
  quota: 1,
  draws: []
});

const participants = [
  buildParticipant({
    id: 'participant-1',
    user: buildUser({ id: 'user-1', qualityScore: 95 }),
    completions: [buildCompletion()]
  }),
  buildParticipant({
    id: 'participant-2',
    user: buildUser({ id: 'user-2', qualityScore: 10 }),
    completions: [buildCompletion()]
  }),
  buildParticipant({
    id: 'participant-3',
    user: buildUser({ id: 'user-3', qualityScore: 80 }),
    completions: [buildCompletion()]
  })
];

type DrawProps = ComponentProps<typeof PublicWinnerDraw>;

const drawElement = (props: Partial<DrawProps> = {}) => (
  <PublicWinnerDraw
    sweepstakesName="Summer Giveaway"
    prizes={[headset(), giftCard]}
    participants={participants}
    sweepstakesId="sweep-1"
    slug="acme"
    criteria={buildCriteria({ minQualityScore: 50, minTasksCompleted: 1 })}
    {...props}
  />
);

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('PublicWinnerDraw', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'Date'
      ]
    });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot once the existing winners are revealed', async () => {
    const { container } = render(drawElement());
    await advance(5_000);
    expect(container.firstChild).toMatchSnapshot();
  });
});
