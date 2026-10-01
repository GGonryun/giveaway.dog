import { act, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOW } from '@/components/sweepstakes/__tests__/fixtures';
import { PublicWinnerPicker } from '../public-winner-picker';

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
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>
}));

type PickerProps = ComponentProps<typeof PublicWinnerPicker>;

const renderPicker = (props: Partial<PickerProps> = {}) => {
  const handlers = { onClose: vi.fn(), onComplete: vi.fn() };
  const result = render(
    <PublicWinnerPicker
      totalParticipants={10}
      numberOfWinners={2}
      {...handlers}
      {...props}
    />
  );
  return { ...result, ...handlers };
};

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const trophies = (container: HTMLElement) =>
  container.querySelectorAll('.lucide-trophy').length;

describe('PublicWinnerPicker', () => {
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
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.mocked(confetti).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('before the draw', () => {
    it('describes how many winners will be picked from how many participants', () => {
      renderPicker();
      expect(
        screen.getByRole('heading', { name: 'Winner Selection' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Ready to pick 2 winners from 10 participants')
      ).toBeInTheDocument();
    });

    it('uses the singular for one winner and one participant', () => {
      renderPicker({ totalParticipants: 1, numberOfWinners: 1 });
      expect(
        screen.getByText('Ready to pick 1 winner from 1 participant')
      ).toBeInTheDocument();
    });

    it('shows at least eight hidden cards', () => {
      renderPicker({ totalParticipants: 3, numberOfWinners: 1 });
      expect(screen.getAllByText('?')).toHaveLength(8);
    });

    it('shows one card per participant', () => {
      renderPicker({ totalParticipants: 12 });
      expect(screen.getAllByText('?')).toHaveLength(12);
    });

    it('shows at most 32 cards and says how many exist', () => {
      renderPicker({ totalParticipants: 40 });
      expect(screen.getAllByText('?')).toHaveLength(32);
      expect(screen.getByText('Showing 32 of 40 cards')).toBeInTheDocument();
    });

    it('cancels from the cancel button', () => {
      const { onClose } = renderPicker();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes from the close icon', () => {
      const { onClose } = renderPicker();
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('drawing', () => {
    const start = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start Draw' }));
    };

    it('shuffles the participants first and hides the actions', async () => {
      renderPicker();
      start();
      await advance(0);
      expect(screen.getByText('Shuffling participants...')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Cancel' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Start Draw' })
      ).not.toBeInTheDocument();
    });

    it('reveals the winners one by one with a burst of confetti', async () => {
      const { container } = renderPicker();
      start();

      await advance(3_200);
      expect(
        screen.getByText('Revealing winner 0 of 2...')
      ).toBeInTheDocument();
      expect(trophies(container)).toBe(0);

      await advance(800);
      expect(
        screen.getByText('Revealing winner 1 of 2...')
      ).toBeInTheDocument();
      expect(trophies(container)).toBe(1);
      expect(confetti).toHaveBeenLastCalledWith({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      await advance(800);
      expect(
        screen.getByText('Revealing winner 2 of 2...')
      ).toBeInTheDocument();
      expect(trophies(container)).toBe(2);
    });

    it('celebrates the winners and completes after the celebration', async () => {
      const { onComplete, onClose } = renderPicker();
      start();

      await advance(3_200 + 1_600 + 1_000);
      expect(
        screen.getByText('Congratulations to all 2 winners!')
      ).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();

      await advance(3_000);
      expect(onComplete).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('uses the singular when celebrating one winner', async () => {
      renderPicker({ numberOfWinners: 1 });
      start();
      await advance(3_200 + 800 + 1_000);
      expect(
        screen.getByText('Congratulations to all 1 winner!')
      ).toBeInTheDocument();
    });
  });
});
