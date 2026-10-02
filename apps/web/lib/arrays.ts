export function takeUntil<T>(
  arr: T[] | undefined,
  predicate: (item: T) => boolean
): T[] {
  if (!arr) return [];
  const index = arr.findIndex(predicate);
  return index === -1 ? arr : arr.slice(0, index);
}
export const pickRandom = <T>(arr: T[]): T | null => {
  if (arr.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};
