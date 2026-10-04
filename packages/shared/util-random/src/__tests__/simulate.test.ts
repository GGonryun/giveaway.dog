import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simulateNetworkDelay } from '../simulate';

const trackSettled = (promise: Promise<unknown>) => {
  const state = { settled: false, value: 'unset' as unknown };
  promise.then((value) => {
    state.settled = true;
    state.value = value;
  });
  return state;
};

describe('simulateNetworkDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when an explicit delay is given', () => {
    it('waits exactly that many milliseconds', async () => {
      const state = trackSettled(simulateNetworkDelay(500));

      await vi.advanceTimersByTimeAsync(499);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(1);

      expect([before, state.settled]).toEqual([false, true]);
    });

    it('resolves with undefined', async () => {
      const state = trackSettled(simulateNetworkDelay(10));

      await vi.advanceTimersByTimeAsync(10);

      expect(state.value).toBeUndefined();
    });

    it('does not draw a random delay', async () => {
      const random = vi.spyOn(Math, 'random');

      const promise = simulateNetworkDelay(10);
      await vi.advanceTimersByTimeAsync(10);
      await promise;

      expect(random).not.toHaveBeenCalled();
    });
  });

  describe('when no delay is given', () => {
    it('waits the minimum of 200ms when Math.random returns 0', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const state = trackSettled(simulateNetworkDelay());

      await vi.advanceTimersByTimeAsync(199);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(1);

      expect([before, state.settled]).toEqual([false, true]);
    });

    it('waits the maximum of 1000ms when Math.random is just below 1', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999999);
      const state = trackSettled(simulateNetworkDelay());

      await vi.advanceTimersByTimeAsync(999);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(1);

      expect([before, state.settled]).toEqual([false, true]);
    });

    it('treats a zero delay as no delay and uses a random one', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const state = trackSettled(simulateNetworkDelay(0));

      await vi.advanceTimersByTimeAsync(0);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(200);

      expect([before, state.settled]).toEqual([false, true]);
    });

    it('resolves with undefined', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const state = trackSettled(simulateNetworkDelay());

      await vi.advanceTimersByTimeAsync(200);

      expect(state).toEqual({ settled: true, value: undefined });
    });
  });
});
