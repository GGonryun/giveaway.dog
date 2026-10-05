export type WeightedItem<T> = {
  item: T;
  weight: number; // must be >= 0
};

export type WeightedIndex = {
  prefix: number[];
  total: number;
};

export function buildWeightedIndex<T>(items: WeightedItem<T>[]): WeightedIndex {
  const prefix: number[] = [];
  let total = 0;

  for (const item of items) {
    if (item.weight <= 0) continue;

    total += item.weight;
    prefix.push(total);
  }

  if (total === 0) {
    throw new Error('Total weight must be greater than 0');
  }

  return { prefix, total };
}

export function pickWeightedIndex(
  index: WeightedIndex,
  rng: () => number = Math.random
): number {
  const r = rng() * index.total;

  let lo = 0;
  let hi = index.prefix.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (r < index.prefix[mid]) hi = mid;
    else lo = mid + 1;
  }

  return lo;
}

export function pickWeightedValue<T>(
  items: WeightedItem<T>[],
  index: WeightedIndex,
  rng?: () => number
): T {
  const i = pickWeightedIndex(index, rng);
  return items[i].item;
}

/**
 * Picks multiple values from a weighted list, allowing duplicates.
 */
export function pickManyWeighted<T>(
  items: WeightedItem<T>[],
  count: number,
  rng?: () => number
): T[] {
  const index = buildWeightedIndex(items);
  const results: T[] = [];

  for (let i = 0; i < count; i++) {
    results.push(pickWeightedValue(items, index, rng));
  }

  return results;
}

/**
 * Picks multiple values from a weighted list, ensuring no duplicates.
 */
export function pickUniqueWeighted<T>(
  items: WeightedItem<T>[],
  count: number,
  rng?: () => number
): T[] {
  const pool = [...items];
  const results: T[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = buildWeightedIndex(pool);
    const pickedIndex = pickWeightedIndex(index, rng);

    results.push(pool[pickedIndex].item);
    pool.splice(pickedIndex, 1);
  }

  return results;
}
