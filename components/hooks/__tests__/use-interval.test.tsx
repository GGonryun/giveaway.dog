import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from '../use-interval';

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when enabled', () => {
    it('calls the callback once per elapsed delay', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 1000));

      vi.advanceTimersByTime(3000);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('does not call the callback before the first delay has elapsed', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 1000));

      vi.advanceTimersByTime(999);

      expect(callback).not.toHaveBeenCalled();
    });

    it('calls the latest callback without restarting the timer', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(
        ({ callback }) => useInterval(callback, 1000),
        { initialProps: { callback: first } }
      );

      vi.advanceTimersByTime(600);
      rerender({ callback: second });
      vi.advanceTimersByTime(400);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('restarts the timer with the new delay when the delay changes', () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ delay }) => useInterval(callback, delay),
        { initialProps: { delay: 1000 } }
      );

      vi.advanceTimersByTime(600);
      rerender({ delay: 500 });
      vi.advanceTimersByTime(499);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('when disabled', () => {
    it('does not call the callback', () => {
      const callback = vi.fn();
      renderHook(() => useInterval(callback, 1000, true));

      vi.advanceTimersByTime(5000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('starts calling the callback once it is enabled again', () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ disable }) => useInterval(callback, 1000, disable),
        { initialProps: { disable: true } }
      );

      vi.advanceTimersByTime(2000);
      rerender({ disable: false });
      vi.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('when unmounted', () => {
    it('stops calling the callback', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useInterval(callback, 1000));

      vi.advanceTimersByTime(1000);
      unmount();
      vi.advanceTimersByTime(5000);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
