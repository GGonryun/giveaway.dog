import { describe, expect, it } from 'vitest';
import { pickPackages, seededRandom, seedFrom } from '../pick-packages.ts';

const CANDIDATES = Array.from(
  { length: 20 },
  (_, index) => `packages/p/p-${index}`
);

describe('seedFrom', () => {
  it('returns the same seed for the same text', () => {
    expect(seedFrom('2026-10-06')).toBe(seedFrom('2026-10-06'));
  });

  it('returns different seeds for different texts', () => {
    expect(seedFrom('2026-10-06')).not.toBe(seedFrom('2026-10-07'));
  });

  it('returns an unsigned 32-bit integer', () => {
    const seed = seedFrom('any text');

    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
  });

  it('matches the 32-bit FNV-1a hash', () => {
    expect(seedFrom('')).toBe(2166136261);
    expect(seedFrom('a')).toBe(0xe40c292c);
  });
});

describe('seededRandom', () => {
  it('returns the mulberry32 sequence of the seed', () => {
    const random = seededRandom(42);

    expect([random(), random(), random()]).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099
    ]);
  });

  it('repeats the same sequence for the same seed', () => {
    const first = seededRandom(42);
    const second = seededRandom(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('returns numbers in [0, 1)', () => {
    const random = seededRandom(7);
    const values = Array.from({ length: 1000 }, random);

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });

  it('spreads the numbers over the whole range', () => {
    const random = seededRandom(7);
    const buckets = new Set(
      Array.from({ length: 1000 }, () => Math.floor(random() * 10))
    );

    expect(buckets.size).toBe(10);
  });

  it('starts differently for different seeds', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe('pickPackages', () => {
  it('shuffles the sorted candidates with the seeded random sequence', () => {
    expect(pickPackages(CANDIDATES, 5, '2026-10-06')).toEqual([
      'packages/p/p-13',
      'packages/p/p-1',
      'packages/p/p-4',
      'packages/p/p-11',
      'packages/p/p-16'
    ]);
    expect(pickPackages(['a', 'b', 'c'], 3, 'seed')).toEqual(['b', 'a', 'c']);
  });

  it('picks the requested number of distinct candidates', () => {
    const picked = pickPackages(CANDIDATES, 5, '2026-10-06');

    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
    for (const dir of picked) {
      expect(CANDIDATES).toContain(dir);
    }
  });

  it('picks the same packages for the same seed, whatever the input order', () => {
    expect(pickPackages(CANDIDATES, 5, 'seed')).toEqual(
      pickPackages([...CANDIDATES].reverse(), 5, 'seed')
    );
  });

  it('picks different packages for different seeds', () => {
    expect(pickPackages(CANDIDATES, 5, '2026-10-06')).not.toEqual(
      pickPackages(CANDIDATES, 5, '2026-10-07')
    );
  });

  it('does not pick in sorted order', () => {
    const picked = pickPackages(CANDIDATES, CANDIDATES.length, 'seed');

    expect(picked).not.toEqual([...CANDIDATES].sort());
    expect([...picked].sort()).toEqual([...CANDIDATES].sort());
  });

  it('returns every candidate when the count is larger than the list', () => {
    expect(pickPackages(['a', 'b'], 5, 'seed').sort()).toEqual(['a', 'b']);
  });

  it('returns nothing for a count of zero or less', () => {
    expect(pickPackages(CANDIDATES, 0, 'seed')).toEqual([]);
    expect(pickPackages(CANDIDATES, -1, 'seed')).toEqual([]);
  });

  it('does not change the candidate list', () => {
    const candidates = ['c', 'a', 'b'];

    pickPackages(candidates, 2, 'seed');

    expect(candidates).toEqual(['c', 'a', 'b']);
  });
});
