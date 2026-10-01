import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitAtLeast } from '../wait-at-least';

const trackSettled = <T>(promise: Promise<T>) => {
  const state: { settled: boolean; value?: T; error?: unknown } = {
    settled: false
  };
  promise.then(
    (value) => {
      state.settled = true;
      state.value = value;
    },
    (error: unknown) => {
      state.settled = true;
      state.error = error;
    }
  );
  return state;
};

describe('waitAtLeast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the function finishes faster than the minimum', () => {
    it('waits for the remaining time before resolving', async () => {
      const state = trackSettled(waitAtLeast(async () => 'done', 500));

      await vi.advanceTimersByTimeAsync(499);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(1);

      expect([before, state.settled]).toEqual([false, true]);
    });

    it('resolves with the function result', async () => {
      const state = trackSettled(waitAtLeast(async () => ({ id: 1 }), 100));

      await vi.advanceTimersByTimeAsync(100);

      expect(state.value).toEqual({ id: 1 });
    });

    it('only waits for the time not already spent in the function', async () => {
      const fn = () =>
        new Promise<string>((resolve) => setTimeout(() => resolve('x'), 300));
      const state = trackSettled(waitAtLeast(fn, 500));

      await vi.advanceTimersByTimeAsync(499);
      const before = state.settled;
      await vi.advanceTimersByTimeAsync(1);

      expect([before, state.settled]).toEqual([false, true]);
    });
  });

  describe('when the function takes at least the minimum', () => {
    it('resolves as soon as the function finishes', async () => {
      const fn = () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('slow'), 800)
        );
      const state = trackSettled(waitAtLeast(fn, 500));

      await vi.advanceTimersByTimeAsync(800);

      expect(state).toEqual({ settled: true, value: 'slow' });
    });

    it('does not schedule an extra timer after the function finishes', async () => {
      const fn = () =>
        new Promise<number>((resolve) => setTimeout(() => resolve(1), 500));
      const promise = waitAtLeast(fn, 500);

      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toBe(1);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('when the minimum is not positive', () => {
    it.each([0, -100])(
      'resolves without waiting for a minimum of %s',
      async (minimum) => {
        const state = trackSettled(waitAtLeast(async () => 'now', minimum));

        await vi.advanceTimersByTimeAsync(0);

        expect(state).toEqual({ settled: true, value: 'now' });
      }
    );
  });

  describe('when the function rejects', () => {
    it('rejects immediately without waiting for the minimum', async () => {
      const error = new Error('boom');
      const state = trackSettled(
        waitAtLeast(async () => {
          throw error;
        }, 1000)
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(state).toEqual({ settled: true, error });
    });
  });

  it('calls the function exactly once', async () => {
    const fn = vi.fn(async () => 'once');
    const promise = waitAtLeast(fn, 10);

    await vi.advanceTimersByTimeAsync(10);
    await promise;

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
