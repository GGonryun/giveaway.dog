export function takeUntil<T>(
  arr: T[] | undefined,
  predicate: (item: T) => boolean
): T[] {
  if (!arr) return [];
  const index = arr.findIndex(predicate);
  return index === -1 ? arr : arr.slice(0, index);
}
