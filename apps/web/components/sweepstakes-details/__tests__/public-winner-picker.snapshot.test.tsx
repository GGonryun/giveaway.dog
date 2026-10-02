import { render } from '@testing-library/react';
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

  it('matches the snapshot before the draw', () => {
    const { container } = renderPicker();
    expect(container.firstChild).toMatchSnapshot();
  });
});
