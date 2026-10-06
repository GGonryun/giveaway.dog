import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertProperty,
  randomSeed,
  seededRandom
} from '@giveaway/testing-server/property';
import { rng } from '../rng';

const unitInterval = fc.double({
  min: 0,
  max: 1,
  maxExcluded: true,
  noNaN: true
});

const bounds = fc
  .tuple(
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
    fc.integer({ min: -1_000_000, max: 1_000_000 })
  )
  .map(([a, b]) => (a <= b ? [a, b] : [b, a]));

const byValue = (a: number, b: number) => a - b;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rng properties', () => {
  it('[RNG-001] shuffleArray returns a permutation of its input and leaves the input unchanged', () => {
    assertProperty(
      fc.property(fc.array(fc.integer()), randomSeed, (array, seed) => {
        vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
        const original = [...array];

        const shuffled = rng.shuffleArray(array);

        expect(array).toEqual(original);
        expect([...shuffled].sort(byValue)).toEqual(
          [...original].sort(byValue)
        );
      })
    );
  });

  it('[RNG-002] randomBetween returns an integer within its inclusive bounds', () => {
    assertProperty(
      fc.property(bounds, unitInterval, ([min, max], random) => {
        vi.spyOn(Math, 'random').mockReturnValue(random);

        const value = rng.randomBetween(min, max);

        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      })
    );
  });
});
