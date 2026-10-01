import { act, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
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
} from '@/components/sweepstakes/__tests__/fixtures';
import { rollPrizes } from '@/lib/winners/procedures/roll-prizes';
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
const omar = buildUserProfile({ id: 'user-5', name: 'Omar Owens' });

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

const burstCalls = () =>
  vi
    .mocked(confetti)
    .mock.calls.filter(([options]) => options?.particleCount === 60);

const celebrationCalls = () =>
  vi
    .mocked(confetti)
    .mock.calls.filter(([options]) => options?.particleCount === 3);

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

  it('shows the sweepstakes name and the number of eligible participants', () => {
    render(drawElement());
    expect(
      screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
    ).toBeInTheDocument();
    expect(screen.getByText('2 eligible participants')).toBeInTheDocument();
  });

  it('uses the singular for one eligible participant', () => {
    render(drawElement({ participants: participants.slice(0, 1) }));
    expect(screen.getByText('1 eligible participant')).toBeInTheDocument();
  });

  it('links back to the winners page', () => {
    render(drawElement());
    expect(
      screen.getByRole('link', { name: 'Random Name Picker' })
    ).toHaveAttribute('href', '/app/acme/sweepstakes/sweep-1/winners');
  });

  it('closes the picker from the header', () => {
    render(drawElement());
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme/sweepstakes/sweep-1/winners'
    );
  });

  describe('prize cards', () => {
    it('renders a hidden card for every winner slot', () => {
      render(
        drawElement({
          prizes: [
            giftCard,
            { ...giftCard, id: 'prize-3', name: 'Mug', quota: 2 }
          ]
        })
      );
      expect(screen.getAllByText('?')).toHaveLength(3);
      expect(screen.getAllByText('Winner #1')).toHaveLength(2);
      expect(screen.getByText('Winner #2')).toBeInTheDocument();
      expect(screen.getAllByText('Mug')).toHaveLength(2);
    });

    it('explains when there are no prizes to reveal', () => {
      render(drawElement({ prizes: [] }));
      expect(screen.getByText('No prizes to reveal...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Return to Sweepstakes' })
      ).toBeInTheDocument();
    });

    it('reveals the existing winners one after another with confetti', async () => {
      render(drawElement());
      expect(screen.queryByText('Wendy Winner')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Drawing winners...' })
      ).toBeDisabled();

      await advance(699);
      expect(screen.queryByText('Wendy Winner')).not.toBeInTheDocument();

      await advance(1);
      expect(screen.getByText('Wendy Winner')).toBeInTheDocument();
      expect(screen.getByText('wins')).toBeInTheDocument();
      expect(burstCalls()).toEqual([
        [{ particleCount: 60, spread: 70, origin: { y: 0.6 } }]
      ]);
    });

    it('re-enables drawing once the reveal is over', async () => {
      render(drawElement());
      await advance(949);
      expect(
        screen.getByRole('button', { name: 'Drawing winners...' })
      ).toBeDisabled();
      await advance(1);
      expect(
        screen.getByRole('button', { name: 'Draw All Winners' })
      ).toBeEnabled();
      expect(celebrationCalls()).toHaveLength(0);
    });

    it('does not draw when a hidden card is clicked', async () => {
      render(drawElement());
      await advance(950);
      fireEvent.click(screen.getByText('Winner #2'));
      expect(rollPrizes).not.toHaveBeenCalled();
    });
  });

  describe('drawing', () => {
    it('draws every remaining winner and refreshes the page', async () => {
      vi.mocked(rollPrizes).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      render(drawElement());
      await advance(950);

      fireEvent.click(screen.getByRole('button', { name: 'Draw All Winners' }));
      await advance(0);

      expect(rollPrizes).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme'
      });
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('only animates the winners that are new after a refresh', async () => {
      const { rerender } = render(drawElement());
      await advance(950);
      vi.mocked(confetti).mockClear();

      rerender(
        drawElement({
          prizes: [
            headset([winnerDraw('draw-1'), winnerDraw('draw-9', omar)]),
            giftCard
          ]
        })
      );

      expect(screen.getByText('Wendy Winner')).toBeInTheDocument();
      expect(screen.queryByText('Omar Owens')).not.toBeInTheDocument();
      await advance(700);
      expect(screen.getByText('Omar Owens')).toBeInTheDocument();
      expect(burstCalls()).toHaveLength(1);
    });

    it('never reveals winners that arrive while another reveal is running', async () => {
      const { rerender } = render(drawElement());
      await advance(100);

      rerender(
        drawElement({
          prizes: [
            headset([winnerDraw('draw-1'), winnerDraw('draw-9', omar)]),
            giftCard
          ]
        })
      );
      await advance(10_000);

      expect(screen.getByText('Wendy Winner')).toBeInTheDocument();
      expect(screen.queryByText('Omar Owens')).not.toBeInTheDocument();
      expect(screen.getByText('Winner #2')).toBeInTheDocument();
    });
  });

  describe('when every winner is drawn', () => {
    const allDrawn = () =>
      drawElement({
        prizes: [
          buildSweepstakesPrize({
            id: 'prize-1',
            name: 'Gaming Headset',
            quota: 1,
            draws: [winnerDraw('draw-1')]
          })
        ]
      });

    it('celebrates for four seconds after the last reveal', async () => {
      render(allDrawn());
      await advance(950);
      const afterReveal = celebrationCalls().length;
      expect(afterReveal).toBeGreaterThan(0);
      expect(celebrationCalls()[0][0]).toMatchObject({
        angle: 60,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });

      await advance(4_100);
      const afterCelebration = celebrationCalls().length;
      expect(afterCelebration).toBeGreaterThan(afterReveal);
      await advance(1_000);
      expect(celebrationCalls()).toHaveLength(afterCelebration);
    });

    it('offers to return to the sweepstakes', async () => {
      render(allDrawn());
      await advance(950);
      fireEvent.click(
        screen.getByRole('button', { name: 'Return to Sweepstakes' })
      );
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/winners'
      );
      expect(
        screen.queryByRole('button', { name: 'Draw All Winners' })
      ).not.toBeInTheDocument();
    });
  });
});
