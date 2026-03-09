/**
 * Ensures an async function takes at least the specified duration to complete.
 * If the function completes faster, it will wait until the minimum duration is reached.
 *
 * @param fn - The async function to execute
 * @param minDurationMs - Minimum duration in milliseconds
 * @returns The result of the async function
 */
export async function waitAtLeast<T>(
  fn: () => Promise<T>,
  minDurationMs: number
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const elapsed = performance.now() - startTime;
  const remaining = minDurationMs - elapsed;

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  return result;
}
