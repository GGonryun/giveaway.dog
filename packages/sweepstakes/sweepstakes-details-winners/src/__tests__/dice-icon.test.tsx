import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiceIcon } from '../dice-icon';

const icon = (container: HTMLElement) => container.querySelector('svg');

describe('DiceIcon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a still, grey one when not rolling', () => {
    const { container } = render(<DiceIcon isRolling={false} />);
    expect(icon(container)).toHaveClass('lucide-dice-1', 'text-gray-400');
    expect(icon(container)).not.toHaveClass('animate-spin');

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(icon(container)).toHaveClass('lucide-dice-1');
  });

  it('spins and cycles through the faces every 150ms while rolling', () => {
    const { container } = render(<DiceIcon isRolling />);
    expect(icon(container)).toHaveClass(
      'lucide-dice-1',
      'animate-spin',
      'text-blue-500'
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(icon(container)).toHaveClass('lucide-dice-2');

    act(() => {
      vi.advanceTimersByTime(150 * 4);
    });
    expect(icon(container)).toHaveClass('lucide-dice-6');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(icon(container)).toHaveClass('lucide-dice-1');
  });

  it('keeps the last face when the roll stops', () => {
    const { container, rerender } = render(<DiceIcon isRolling />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender(<DiceIcon isRolling={false} />);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(icon(container)).toHaveClass('lucide-dice-3', 'text-gray-400');
    expect(icon(container)).not.toHaveClass('animate-spin');
  });
});
