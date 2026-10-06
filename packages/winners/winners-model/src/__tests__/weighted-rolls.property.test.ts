import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  assertProperty,
  randomSeed,
  seededRandom
} from '@giveaway/testing-server/property';
import {
  buildWeightedIndex,
  pickManyWeighted,
  pickUniqueWeighted,
  pickWeightedValue,
  type WeightedItem
} from '../weighted-rolls';

const DRAWS = 5000;

const positiveWeight = fc.integer({ min: 1, max: 20 });

const weightOrZero = fc.oneof(fc.constant(0), positiveWeight);

const toItems = (weights: number[]): WeightedItem<number>[] =>
  weights.map((weight, item) => ({ item, weight }));

const positiveItems = fc
  .array(positiveWeight, { minLength: 1, maxLength: 8 })
  .map(toItems);

const itemsWithZeroBeforePositive = fc
  .record({
    before: fc.array(weightOrZero, { maxLength: 5 }),
    after: fc.array(weightOrZero, { maxLength: 5 }),
    last: positiveWeight
  })
  .map(({ before, after, last }) => toItems([...before, 0, ...after, last]));

const totalWeight = (items: WeightedItem<number>[]) =>
  items.reduce((sum, { weight }) => sum + Math.max(weight, 0), 0);

const randomGrid = (items: WeightedItem<number>[]) => {
  const size = 2 * totalWeight(items);
  return Array.from({ length: size }, (_, k) => (k + 0.5) / size);
};

const singlePicks = (items: WeightedItem<number>[], random: number) => {
  const rng = () => random;
  return [
    pickWeightedValue(items, buildWeightedIndex(items), rng),
    pickManyWeighted(items, 1, rng)[0],
    pickUniqueWeighted(items, 1, rng)[0]
  ];
};

const reachableItems = (items: WeightedItem<number>[]) =>
  new Set(randomGrid(items).flatMap((random) => singlePicks(items, random)));

const positiveItemIds = (items: WeightedItem<number>[]) =>
  new Set(items.filter(({ weight }) => weight > 0).map(({ item }) => item));

const expectCloseToWeights = (
  items: WeightedItem<number>[],
  picks: number[]
) => {
  const total = totalWeight(items);
  for (const { item, weight } of items) {
    const p = weight / total;
    const observed = picks.filter((pick) => pick === item).length;
    const tolerance = 6 * Math.sqrt(picks.length * p * (1 - p)) + 1;
    expect(Math.abs(observed - picks.length * p)).toBeLessThanOrEqual(
      tolerance
    );
  }
};

describe('weighted roll properties', () => {
  it.fails(
    '[DRAW-001] an item with a weight of 0 is never returned (fails until #134 is fixed)',
    () => {
      assertProperty(
        fc.property(itemsWithZeroBeforePositive, (items) => {
          for (const random of randomGrid(items)) {
            for (const picked of singlePicks(items, random)) {
              expect(items[picked].weight).toBeGreaterThan(0);
            }
          }
        })
      );
    }
  );

  it('[DRAW-008] every item can be returned when every weight is positive', () => {
    assertProperty(
      fc.property(positiveItems, (items) => {
        expect(reachableItems(items)).toEqual(positiveItemIds(items));
      })
    );
  });

  it.fails(
    '[DRAW-008] every item with a positive weight can be returned wherever the zero weights are (fails until #134 is fixed)',
    () => {
      assertProperty(
        fc.property(itemsWithZeroBeforePositive, (items) => {
          expect(reachableItems(items)).toEqual(positiveItemIds(items));
        })
      );
    }
  );

  it('[DRAW-005] every returned item is one of the input items', () => {
    assertProperty(
      fc.property(
        positiveItems,
        fc.integer({ min: 0, max: 20 }),
        randomSeed,
        (items, count, seed) => {
          const inputs = items.map(({ item }) => item);
          const rng = seededRandom(seed);

          const picks = [
            ...pickManyWeighted(items, count, rng),
            ...pickUniqueWeighted(items, count, rng)
          ];

          for (const picked of picks) {
            expect(inputs).toContain(picked);
          }
        }
      )
    );
  });

  it('[DRAW-006] pickUniqueWeighted returns no duplicates and min(count, items) results', () => {
    assertProperty(
      fc.property(
        positiveItems,
        fc.integer({ min: 0, max: 12 }),
        randomSeed,
        (items, count, seed) => {
          const picks = pickUniqueWeighted(items, count, seededRandom(seed));

          expect(new Set(picks).size).toBe(picks.length);
          expect(picks).toHaveLength(Math.min(count, items.length));
        }
      )
    );
  });

  it('[DRAW-007] pickManyWeighted picks each item in proportion to its weight', () => {
    assertProperty(
      fc.property(positiveItems, randomSeed, (items, seed) => {
        const picks = pickManyWeighted(items, DRAWS, seededRandom(seed));

        expectCloseToWeights(items, picks);
      })
    );
  });

  it('[DRAW-007] a single pickUniqueWeighted draw picks each item in proportion to its weight', () => {
    assertProperty(
      fc.property(positiveItems, randomSeed, (items, seed) => {
        const rng = seededRandom(seed);
        const picks = Array.from(
          { length: DRAWS },
          () => pickUniqueWeighted(items, 1, rng)[0]
        );

        expectCloseToWeights(items, picks);
      })
    );
  });
});
