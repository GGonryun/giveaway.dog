import { describe, it, expect, vi, afterEach } from 'vitest';
import { takeUntil, pickRandom } from '../arrays';

describe('takeUntil', () => {
  it('returns an empty array when the input is undefined', () => {
    expect(takeUntil<number>(undefined, () => true)).toEqual([]);
  });

  it('returns the items before the first element matching the predicate', () => {
    expect(takeUntil([1, 2, 3, 4, 3], (n) => n === 3)).toEqual([1, 2]);
  });

  it('returns an empty array when the first element matches', () => {
    expect(takeUntil([5, 6, 7], (n) => n === 5)).toEqual([]);
  });

  it('returns the same array reference when nothing matches', () => {
    const input = [1, 2, 3];

    const result = takeUntil(input, (n) => n > 10);

    expect(result).toBe(input);
  });

  it('returns a new array without mutating the input when an element matches', () => {
    const input = ['a', 'b', 'c'];

    const result = takeUntil(input, (s) => s === 'c');

    expect(result).not.toBe(input);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('returns the empty input array unchanged', () => {
    const input: number[] = [];

    expect(takeUntil(input, () => true)).toBe(input);
  });

  it('calls the predicate with each element until the first match', () => {
    const predicate = vi.fn((n: number) => n === 2);

    takeUntil([1, 2, 3], predicate);

    expect(predicate.mock.calls.map((call) => call[0])).toEqual([1, 2]);
  });
});

describe('pickRandom', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null for an empty array', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('does not consult Math.random for an empty array', () => {
    const random = vi.spyOn(Math, 'random');

    pickRandom([]);

    expect(random).not.toHaveBeenCalled();
  });

  it('returns the first element when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(pickRandom(['a', 'b', 'c'])).toBe('a');
  });

  it('returns the last element when Math.random is just below 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);

    expect(pickRandom(['a', 'b', 'c'])).toBe('c');
  });

  it('floors the scaled random value to pick an index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(pickRandom(['a', 'b', 'c', 'd'])).toBe('c');
  });

  it('returns the only element of a single item array', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);

    expect(pickRandom([42])).toBe(42);
  });

  it('returns a falsy element as is instead of null', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(pickRandom([0, 1])).toBe(0);
  });
});
