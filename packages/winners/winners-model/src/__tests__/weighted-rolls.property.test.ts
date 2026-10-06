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

const nonPositiveWeight = fc.oneof(
  fc.constant(0),
  fc.integer({ min: -20, max: -1 })
);

const weightOrNonPositive = fc.oneof(
  fc.constant(0),
  fc.integer({ min: -20, max: -1 }),
  positiveWeight
);

const toItems = (weights: number[]): WeightedItem<number>[] =>
  weights.map((weight, item) => ({ item, weight }));

const positiveItems = fc
  .array(positiveWeight, { minLength: 1, maxLength: 8 })
  .map(toItems);

const itemsWithNonPositiveBeforePositive = fc
  .record({
    before: fc.array(weightOrNonPositive, { maxLength: 5 }),
    nonPositive: nonPositiveWeight,
    after: fc.array(weightOrNonPositive, { maxLength: 5 }),
    last: positiveWeight
  })
  .map(({ before, nonPositive, after, last }) =>
    toItems([...before, nonPositive, ...after, last])
  );

const itemsWithNonPositiveWeights = fc
  .array(weightOrNonPositive, { minLength: 1, maxLength: 12 })
  .filter((weights) => weights.some((weight) => weight > 0))
  .map(toItems);

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
    const p = Math.max(weight, 0) / total;
    const observed = picks.filter((pick) => pick === item).length;
    const tolerance = 6 * Math.sqrt(picks.length * p * (1 - p)) + 1;
    expect(Math.abs(observed - picks.length * p)).toBeLessThanOrEqual(
      tolerance
    );
  }
};

describe('weighted roll properties', () => {
  it('[DRAW-001] an item with a weight of 0 or less is never returned by a single pick', () => {
    assertProperty(
      fc.property(itemsWithNonPositiveBeforePositive, (items) => {
        for (const random of randomGrid(items)) {
          for (const picked of singlePicks(items, random)) {
            expect(items[picked].weight).toBeGreaterThan(0);
          }
        }
      })
    );
  });

  it('[DRAW-001] an item with a weight of 0 or less is never returned by any number of picks', () => {
    assertProperty(
      fc.property(
        itemsWithNonPositiveWeights,
        fc.integer({ min: 0, max: 20 }),
        randomSeed,
        (items, count, seed) => {
          const rng = seededRandom(seed);

          const picks = [
            ...pickManyWeighted(items, count, rng),
            ...pickUniqueWeighted(items, count, rng)
          ];

          for (const picked of picks) {
            expect(items[picked].weight).toBeGreaterThan(0);
          }
        }
      )
    );
  });

  it('[DRAW-008] every item can be returned when every weight is positive', () => {
    assertProperty(
      fc.property(positiveItems, (items) => {
        expect(reachableItems(items)).toEqual(positiveItemIds(items));
      })
    );
  });

  it('[DRAW-008] every item with a positive weight can be returned wherever the weights of 0 or less are', () => {
    assertProperty(
      fc.property(itemsWithNonPositiveBeforePositive, (items) => {
        expect(reachableItems(items)).toEqual(positiveItemIds(items));
      })
    );
  });

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

  it('[DRAW-006] pickUniqueWeighted returns min(count, items with a positive weight) results', () => {
    assertProperty(
      fc.property(
        itemsWithNonPositiveWeights,
        fc.integer({ min: 0, max: 15 }),
        randomSeed,
        (items, count, seed) => {
          const picks = pickUniqueWeighted(items, count, seededRandom(seed));

          expect(new Set(picks).size).toBe(picks.length);
          expect(picks).toHaveLength(
            Math.min(count, positiveItemIds(items).size)
          );
        }
      )
    );
  });

  it('[DRAW-008] pickUniqueWeighted returns every item with a positive weight when the count allows it', () => {
    assertProperty(
      fc.property(itemsWithNonPositiveWeights, randomSeed, (items, seed) => {
        const picks = pickUniqueWeighted(
          items,
          items.length,
          seededRandom(seed)
        );

        expect(new Set(picks)).toEqual(positiveItemIds(items));
      })
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

  it('[DRAW-007] pickManyWeighted and a single pickUniqueWeighted draw pick each item in proportion to its weight wherever the weights of 0 or less are', () => {
    assertProperty(
      fc.property(
        itemsWithNonPositiveBeforePositive,
        randomSeed,
        (items, seed) => {
          const rng = seededRandom(seed);

          expectCloseToWeights(items, pickManyWeighted(items, DRAWS, rng));
          expectCloseToWeights(
            items,
            Array.from(
              { length: DRAWS },
              () => pickUniqueWeighted(items, 1, rng)[0]
            )
          );
        }
      )
    );
  });
});
