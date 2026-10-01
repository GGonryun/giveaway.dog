import { describe, it, expect, vi, afterEach } from 'vitest';
import { rng } from '../rng';

describe('rng', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('randomBetween', () => {
    it('returns the minimum when Math.random returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(rng.randomBetween(200, 1000)).toBe(200);
    });

    it('returns the maximum when Math.random is just below 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999999);

      expect(rng.randomBetween(200, 1000)).toBe(1000);
    });

    it('floors the scaled value into the inclusive range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      expect(rng.randomBetween(1, 10)).toBe(6);
    });

    it('returns the bound when min equals max', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.75);

      expect(rng.randomBetween(7, 7)).toBe(7);
    });

    it('supports negative ranges', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(rng.randomBetween(-5, -1)).toBe(-5);
    });

    it('does not reorder reversed bounds and counts down from the first argument', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9);

      expect([
        rng.randomBetween(10, 5),
        rng.randomBetween(10, 5),
        rng.randomBetween(10, 5)
      ]).toEqual([10, 9, 6]);
    });

    it('maps equal slices of the random range onto each integer in the range', () => {
      const draws = [0, 0.33, 0.34, 0.66, 0.67, 0.99];
      const random = vi.spyOn(Math, 'random');
      draws.forEach((draw) => random.mockReturnValueOnce(draw));

      expect(draws.map(() => rng.randomBetween(1, 3))).toEqual([
        1, 1, 2, 2, 3, 3
      ]);
    });
  });

  describe('shuffleArray', () => {
    it('swaps each position with index 0 when Math.random returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(rng.shuffleArray([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
    });

    it('keeps the order when Math.random is just below 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999999);

      expect(rng.shuffleArray([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    });

    it('uses one random draw per position after the first', () => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      rng.shuffleArray(['a', 'b', 'c', 'd', 'e']);

      expect(random).toHaveBeenCalledTimes(4);
    });

    it('follows the Fisher-Yates swap sequence for a given draw sequence', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.9);

      expect(rng.shuffleArray(['a', 'b', 'c', 'd'])).toEqual([
        'd',
        'b',
        'a',
        'c'
      ]);
    });

    it('does not mutate the input array', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const input = [1, 2, 3];

      rng.shuffleArray(input);

      expect(input).toEqual([1, 2, 3]);
    });

    it('returns a new array instance', () => {
      const input = [1];

      expect(rng.shuffleArray(input)).not.toBe(input);
    });

    it('returns an empty array for an empty input without drawing', () => {
      const random = vi.spyOn(Math, 'random');

      expect(rng.shuffleArray([])).toEqual([]);
      expect(random).not.toHaveBeenCalled();
    });

    it('keeps every element for a varied draw sequence', () => {
      const draws = [0.1, 0.9, 0.4, 0.7, 0.2, 0.5, 0.8, 0.3];
      let call = 0;
      vi.spyOn(Math, 'random').mockImplementation(
        () => draws[call++ % draws.length]
      );
      const input = Array.from({ length: 50 }, (_, i) => i);

      expect([...rng.shuffleArray(input)].sort((a, b) => a - b)).toEqual(input);
    });
  });
});
