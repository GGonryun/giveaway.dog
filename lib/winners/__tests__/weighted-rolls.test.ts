import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildWeightedIndex,
  pickWeightedIndex,
  pickWeightedValue,
  pickManyWeighted,
  pickUniqueWeighted,
  type WeightedItem
} from '../weighted-rolls';

const calculateStats = (counts: number[]) => {
  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    counts.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    min: Math.min(...counts),
    max: Math.max(...counts)
  };
};

describe('buildWeightedIndex', () => {
  it('should build correct prefix sum array for equal weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([1, 2, 3]);
    expect(index.total).toBe(3);
  });

  it('should build correct prefix sum array for different weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 5 },
      { item: 'b', weight: 3 },
      { item: 'c', weight: 2 }
    ];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([5, 8, 10]);
    expect(index.total).toBe(10);
  });

  it('should skip items with zero or negative weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 5 },
      { item: 'b', weight: 0 },
      { item: 'c', weight: -1 },
      { item: 'd', weight: 3 }
    ];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([5, 8]);
    expect(index.total).toBe(8);
  });

  it('should throw error when all weights are zero or negative', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 0 },
      { item: 'b', weight: -1 },
      { item: 'c', weight: 0 }
    ];

    expect(() => buildWeightedIndex(items)).toThrow(
      'Total weight must be greater than 0'
    );
  });

  it('should handle fractional weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1.5 },
      { item: 'b', weight: 2.5 },
      { item: 'c', weight: 3.0 }
    ];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([1.5, 4.0, 7.0]);
    expect(index.total).toBe(7.0);
  });

  it('should handle single item', () => {
    const items: WeightedItem<string>[] = [{ item: 'a', weight: 42 }];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([42]);
    expect(index.total).toBe(42);
  });

  it('should handle large weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1000000 },
      { item: 'b', weight: 2000000 }
    ];

    const index = buildWeightedIndex(items);

    expect(index.prefix).toEqual([1000000, 3000000]);
    expect(index.total).toBe(3000000);
  });
});

describe('pickWeightedIndex', () => {
  it('should always return 0 for single item', () => {
    const index = { prefix: [10], total: 10 };

    for (let i = 0; i < 10; i++) {
      expect(pickWeightedIndex(index)).toBe(0);
    }
  });

  it('should select first item when rng returns 0', () => {
    const index = { prefix: [5, 8, 10], total: 10 };
    const rng = () => 0;

    expect(pickWeightedIndex(index, rng)).toBe(0);
  });

  it('should select items based on weight ranges', () => {
    const index = { prefix: [5, 8, 10], total: 10 };

    expect(pickWeightedIndex(index, () => 0)).toBe(0);
    expect(pickWeightedIndex(index, () => 0.499)).toBe(0);
    expect(pickWeightedIndex(index, () => 0.5)).toBe(1);
    expect(pickWeightedIndex(index, () => 0.799)).toBe(1);
    expect(pickWeightedIndex(index, () => 0.8)).toBe(2);
    expect(pickWeightedIndex(index, () => 0.999)).toBe(2);
  });

  it('should handle edge case at boundaries', () => {
    const index = { prefix: [1, 2, 3], total: 3 };

    expect(pickWeightedIndex(index, () => 0.333)).toBe(0);
    expect(pickWeightedIndex(index, () => 0.334)).toBe(1);
    expect(pickWeightedIndex(index, () => 0.666)).toBe(1);
    expect(pickWeightedIndex(index, () => 0.667)).toBe(2);
  });

  it('should select index 0 for weight [1,1,1] when rng < 0.33', () => {
    const index = { prefix: [1, 2, 3], total: 3 };
    let count = 0;

    for (let i = 0; i < 100; i++) {
      const r = i / 100;
      if (r < 0.33 && pickWeightedIndex(index, () => r) === 0) {
        count++;
      }
    }

    expect(count).toBeGreaterThan(25);
  });
});

describe('pickWeightedValue', () => {
  it('should return the correct weighted value', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 5 },
      { item: 'b', weight: 3 },
      { item: 'c', weight: 2 }
    ];
    const index = buildWeightedIndex(items);

    expect(pickWeightedValue(items, index, () => 0)).toBe('a');
    expect(pickWeightedValue(items, index, () => 0.5)).toBe('b');
    expect(pickWeightedValue(items, index, () => 0.9)).toBe('c');
  });

  it('should handle different value types', () => {
    const items: WeightedItem<number>[] = [
      { item: 100, weight: 1 },
      { item: 200, weight: 1 }
    ];
    const index = buildWeightedIndex(items);

    expect(pickWeightedValue(items, index, () => 0.25)).toBe(100);
    expect(pickWeightedValue(items, index, () => 0.75)).toBe(200);
  });

  it('should work with objects', () => {
    type User = { id: string; name: string };
    const items: WeightedItem<User>[] = [
      { item: { id: '1', name: 'Alice' }, weight: 5 },
      { item: { id: '2', name: 'Bob' }, weight: 5 }
    ];
    const index = buildWeightedIndex(items);

    const result = pickWeightedValue(items, index, () => 0.25);
    expect(result.id).toBe('1');
    expect(result.name).toBe('Alice');
  });
});

describe('pickManyWeighted - Statistical Distribution', () => {
  it('should respect weight ratios over many selections (equal weights)', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ];

    const counts = { a: 0, b: 0, c: 0 };
    const iterations = 3000;

    for (let i = 0; i < iterations; i++) {
      const results = pickManyWeighted(items, 1);
      counts[results[0] as keyof typeof counts]++;
    }

    const expected = iterations / 3;

    expect(counts.a).toBeGreaterThan(expected - 100);
    expect(counts.a).toBeLessThan(expected + 100);
    expect(counts.b).toBeGreaterThan(expected - 100);
    expect(counts.b).toBeLessThan(expected + 100);
    expect(counts.c).toBeGreaterThan(expected - 100);
    expect(counts.c).toBeLessThan(expected + 100);
  });

  it('should respect weight ratios over many selections (weighted 5:3:2)', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 5 },
      { item: 'b', weight: 3 },
      { item: 'c', weight: 2 }
    ];

    const counts = { a: 0, b: 0, c: 0 };
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const results = pickManyWeighted(items, 1);
      counts[results[0] as keyof typeof counts]++;
    }

    const totalWeight = 10;
    const expectedA = (5 / totalWeight) * iterations;
    const expectedB = (3 / totalWeight) * iterations;
    const expectedC = (2 / totalWeight) * iterations;

    expect(counts.a).toBeGreaterThan(expectedA - 200);
    expect(counts.a).toBeLessThan(expectedA + 200);
    expect(counts.b).toBeGreaterThan(expectedB - 150);
    expect(counts.b).toBeLessThan(expectedB + 150);
    expect(counts.c).toBeGreaterThan(expectedC - 120);
    expect(counts.c).toBeLessThan(expectedC + 120);
  });

  it('should respect heavy weight bias (10:1)', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 10 },
      { item: 'b', weight: 1 }
    ];

    const counts = { a: 0, b: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const results = pickManyWeighted(items, 1);
      counts[results[0] as keyof typeof counts]++;
    }

    const expectedA = (10 / 11) * iterations;
    const expectedB = (1 / 11) * iterations;

    expect(counts.a).toBeGreaterThan(expectedA - 100);
    expect(counts.a).toBeLessThan(expectedA + 100);
    expect(counts.b).toBeGreaterThan(expectedB - 50);
    expect(counts.b).toBeLessThan(expectedB + 50);

    const ratio = counts.a / counts.b;
    expect(ratio).toBeGreaterThan(7);
    expect(ratio).toBeLessThan(13);
  });

  it('should allow duplicates when picking multiple', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 }
    ];

    const results = pickManyWeighted(items, 10);
    expect(results).toHaveLength(10);

    const uniqueValues = new Set(results);
    expect(uniqueValues.size).toBeLessThanOrEqual(2);
  });

  it('should return correct count of items', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ];

    expect(pickManyWeighted(items, 0)).toHaveLength(0);
    expect(pickManyWeighted(items, 1)).toHaveLength(1);
    expect(pickManyWeighted(items, 5)).toHaveLength(5);
    expect(pickManyWeighted(items, 100)).toHaveLength(100);
  });

  it('should have fair distribution across large scale picks', () => {
    const items: WeightedItem<number>[] = Array.from(
      { length: 100 },
      (_, i) => ({
        item: i,
        weight: 1
      })
    );

    const iterations = 10000;
    const counts = new Array(100).fill(0);

    for (let i = 0; i < iterations; i++) {
      const results = pickManyWeighted(items, 1);
      counts[results[0]]++;
    }

    const stats = calculateStats(counts);
    const expectedMean = iterations / 100;

    expect(stats.mean).toBe(expectedMean);

    const theoreticalStdDev = Math.sqrt(expectedMean);
    expect(stats.stdDev).toBeGreaterThan(theoreticalStdDev * 0.5);
    expect(stats.stdDev).toBeLessThan(theoreticalStdDev * 1.5);
  });
});

describe('pickUniqueWeighted', () => {
  it('should return unique values only', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ];

    const results = pickUniqueWeighted(items, 3);

    expect(results).toHaveLength(3);
    expect(new Set(results).size).toBe(3);
    expect(results).toContain('a');
    expect(results).toContain('b');
    expect(results).toContain('c');
  });

  it('should limit results to available items', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 }
    ];

    const results = pickUniqueWeighted(items, 5);

    expect(results).toHaveLength(2);
    expect(new Set(results).size).toBe(2);
  });

  it('should respect weights when picking unique items', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 10 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 }
    ];

    const counts = { a: 0, b: 0, c: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const results = pickUniqueWeighted(items, 1);
      counts[results[0] as keyof typeof counts]++;
    }

    expect(counts.a).toBeGreaterThan(700);
    expect(counts.b).toBeLessThan(200);
    expect(counts.c).toBeLessThan(200);
  });

  it('should never pick the same item twice', () => {
    const items: WeightedItem<number>[] = Array.from(
      { length: 20 },
      (_, i) => ({
        item: i,
        weight: 1
      })
    );

    for (let iter = 0; iter < 100; iter++) {
      const results = pickUniqueWeighted(items, 10);
      const uniqueResults = new Set(results);

      expect(results).toHaveLength(10);
      expect(uniqueResults.size).toBe(10);
    }
  });

  it('should handle picking all items', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 2 },
      { item: 'c', weight: 3 }
    ];

    const results = pickUniqueWeighted(items, 3);

    expect(results).toHaveLength(3);
    expect(new Set(results).size).toBe(3);
  });

  it('should return empty array when count is 0', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 }
    ];

    expect(pickUniqueWeighted(items, 0)).toEqual([]);
  });

  it('should maintain fairness even with unique constraint', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 },
      { item: 'd', weight: 1 }
    ];

    const firstPickCounts = { a: 0, b: 0, c: 0, d: 0 };
    const iterations = 4000;

    for (let i = 0; i < iterations; i++) {
      const results = pickUniqueWeighted(items, 2);
      firstPickCounts[results[0] as keyof typeof firstPickCounts]++;
    }

    const expected = iterations / 4;

    expect(firstPickCounts.a).toBeGreaterThan(expected - 150);
    expect(firstPickCounts.a).toBeLessThan(expected + 150);
    expect(firstPickCounts.b).toBeGreaterThan(expected - 150);
    expect(firstPickCounts.b).toBeLessThan(expected + 150);
    expect(firstPickCounts.c).toBeGreaterThan(expected - 150);
    expect(firstPickCounts.c).toBeLessThan(expected + 150);
    expect(firstPickCounts.d).toBeGreaterThan(expected - 150);
    expect(firstPickCounts.d).toBeLessThan(expected + 150);
  });

  it('should handle heavily weighted unique picks', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 100 },
      { item: 'b', weight: 10 },
      { item: 'c', weight: 1 }
    ];

    const counts = { a: 0, b: 0, c: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const results = pickUniqueWeighted(items, 1);
      counts[results[0] as keyof typeof counts]++;
    }

    expect(counts.a).toBeGreaterThan(800);
    expect(counts.b).toBeGreaterThan(50);
    expect(counts.b).toBeLessThan(150);
    expect(counts.c).toBeLessThan(50);
  });

  it('should pick all items with equal probability when all have same weight', () => {
    const items: WeightedItem<number>[] = Array.from(
      { length: 50 },
      (_, i) => ({
        item: i,
        weight: 1
      })
    );

    const allPickedCounts = new Array(50).fill(0);
    const iterations = 500;

    for (let iter = 0; iter < iterations; iter++) {
      const results = pickUniqueWeighted(items, 25);
      for (const val of results) {
        allPickedCounts[val]++;
      }
    }

    const stats = calculateStats(allPickedCounts);
    const expectedMean = (25 * iterations) / 50;

    expect(stats.mean).toBe(expectedMean);

    const theoreticalStdDev = Math.sqrt(expectedMean);
    expect(stats.stdDev).toBeGreaterThan(theoreticalStdDev * 0.4);
    expect(stats.stdDev).toBeLessThan(theoreticalStdDev * 1.8);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle empty array for buildWeightedIndex', () => {
    expect(() => buildWeightedIndex([])).toThrow(
      'Total weight must be greater than 0'
    );
  });

  it('should handle pickManyWeighted with empty items gracefully', () => {
    const items: WeightedItem<string>[] = [];

    expect(() => pickManyWeighted(items, 1)).toThrow();
  });

  it('should handle pickUniqueWeighted with empty items', () => {
    const items: WeightedItem<string>[] = [];

    const results = pickUniqueWeighted(items, 1);
    expect(results).toEqual([]);
  });

  it('should handle very small weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 0.0001 },
      { item: 'b', weight: 0.0001 }
    ];

    const results = pickManyWeighted(items, 10);
    expect(results).toHaveLength(10);
  });

  it('should handle negative count for pickManyWeighted', () => {
    const items: WeightedItem<string>[] = [{ item: 'a', weight: 1 }];

    const results = pickManyWeighted(items, -1);
    expect(results).toEqual([]);
  });

  it('should handle negative count for pickUniqueWeighted', () => {
    const items: WeightedItem<string>[] = [{ item: 'a', weight: 1 }];

    const results = pickUniqueWeighted(items, -1);
    expect(results).toEqual([]);
  });
});

describe('zero weight index alignment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a zero weight item that precedes positive items', () => {
    const items: WeightedItem<string>[] = [
      { item: 'zero', weight: 0 },
      { item: 'one', weight: 1 }
    ];

    expect(pickWeightedValue(items, buildWeightedIndex(items), () => 0)).toBe(
      'zero'
    );
  });

  it('never returns an item positioned after the number of positive weights', () => {
    const items: WeightedItem<string>[] = [
      { item: 'zero', weight: 0 },
      { item: 'one', weight: 1 }
    ];

    expect(pickManyWeighted(items, 3, () => 0.99)).toEqual([
      'zero',
      'zero',
      'zero'
    ]);
  });

  it('throws from pickUniqueWeighted once only zero weight items remain', () => {
    const items: WeightedItem<string>[] = [
      { item: 'a', weight: 1 },
      { item: 'b', weight: 0 }
    ];

    expect(() => pickUniqueWeighted(items, 2, () => 0)).toThrow(
      'Total weight must be greater than 0'
    );
  });

  it('uses Math.random when no rng is provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    expect(pickWeightedIndex({ prefix: [1, 2], total: 2 })).toBe(1);
    expect(Math.random).toHaveBeenCalledTimes(1);
  });
});
