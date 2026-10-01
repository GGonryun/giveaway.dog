import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, debounce } from '../utils';

describe('cn', () => {
  it('joins class names with spaces', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('includes object keys with truthy values only', () => {
    expect(cn({ active: true, disabled: false }, 'base')).toBe('active base');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', { c: true }]])).toBe('a b c');
  });

  it('lets later conflicting tailwind classes win', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('resolves conflicting color utilities', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('keeps non conflicting tailwind classes', () => {
    expect(cn('p-2', 'm-2')).toBe('p-2 m-2');
  });

  it('returns an empty string without inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call the function before the wait elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(99);

    expect(fn).not.toHaveBeenCalled();
  });

  it('calls the function once the wait elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a', 1);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledExactlyOnceWith('a', 1);
  });

  it('collapses rapid calls into one call with the last arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    vi.advanceTimersByTime(50);
    debounced('second');
    vi.advanceTimersByTime(50);
    debounced('third');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledExactlyOnceWith('third');
  });

  it('restarts the wait on every call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(90);
    debounced();
    vi.advanceTimersByTime(90);

    expect(fn).not.toHaveBeenCalled();
  });

  it('can fire again after a previous call completed', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    vi.advanceTimersByTime(100);
    debounced(2);
    vi.advanceTimersByTime(100);

    expect(fn.mock.calls).toEqual([[1], [2]]);
  });

  it('returns undefined from the debounced call', () => {
    const debounced = debounce(() => 'value', 10);

    expect(debounced()).toBeUndefined();
  });

  it('does not call the function after cancel', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(1000);

    expect(fn).not.toHaveBeenCalled();
  });

  it('allows cancel when nothing is pending', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    expect(() => debounced.cancel()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the pending timer on cancel', () => {
    const debounced = debounce(vi.fn(), 100);

    debounced();
    const pending = vi.getTimerCount();
    debounced.cancel();

    expect([pending, vi.getTimerCount()]).toEqual([1, 0]);
  });

  it('keeps a single pending timer across repeated calls', () => {
    const debounced = debounce(vi.fn(), 100);

    debounced();
    debounced();
    debounced();

    expect(vi.getTimerCount()).toBe(1);
  });

  it('can be used again after cancel', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('dropped');
    debounced.cancel();
    debounced('kept');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledExactlyOnceWith('kept');
  });

  it('calls the function on the next tick with a zero wait', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 0);

    debounced();
    const before = fn.mock.calls.length;
    vi.advanceTimersByTime(0);

    expect([before, fn.mock.calls.length]).toEqual([0, 1]);
  });
});
