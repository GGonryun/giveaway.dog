import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REQUEST_TIMEOUT_MS, requestTimeout } from '../request-timeout';

describe('requestTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits 15 seconds by default', () => {
    expect(REQUEST_TIMEOUT_MS).toBe(15_000);
  });

  it('aborts with a TimeoutError after the default time', () => {
    const signal = requestTimeout();

    vi.advanceTimersByTime(REQUEST_TIMEOUT_MS - 1);
    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(1);
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(DOMException);
    expect(signal.reason).toMatchObject({
      name: 'TimeoutError',
      message: 'The operation was aborted due to timeout'
    });
  });

  it('aborts after the given time', () => {
    const signal = requestTimeout(1000);

    vi.advanceTimersByTime(999);
    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(1);
    expect(signal.aborted).toBe(true);
  });

  it('does not keep the process alive while it waits', () => {
    const unref = vi.fn();
    vi.spyOn(globalThis, 'setTimeout').mockReturnValue({
      unref
    } as unknown as ReturnType<typeof setTimeout>);

    requestTimeout();

    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('works where the timer has no unref', () => {
    vi.spyOn(globalThis, 'setTimeout').mockReturnValue(
      1 as unknown as ReturnType<typeof setTimeout>
    );

    expect(requestTimeout().aborted).toBe(false);
  });

  it('aborts when the given signal aborts first', () => {
    const controller = new AbortController();
    const signal = requestTimeout(1000, controller.signal);

    controller.abort(new Error('cancelled'));

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toEqual(new Error('cancelled'));
  });

  it('still aborts after the given time when the given signal does not abort', () => {
    const controller = new AbortController();
    const signal = requestTimeout(1000, controller.signal);

    vi.advanceTimersByTime(1000);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toMatchObject({ name: 'TimeoutError' });
  });
});
