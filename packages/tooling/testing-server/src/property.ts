import fc from 'fast-check';

const readIntegerEnv = (name: string): number | undefined => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, got "${raw}"`);
  }
  return value;
};

export const propertyParameters = <Ts>(
  parameters: fc.Parameters<Ts> = {}
): fc.Parameters<Ts> => {
  const seed = readIntegerEnv('FC_SEED');
  const numRuns = readIntegerEnv('FC_NUM_RUNS');
  const path = process.env.FC_PATH;

  return {
    ...parameters,
    ...(numRuns !== undefined && { numRuns }),
    ...(seed !== undefined && { seed }),
    ...(path && { path, endOnFailure: true })
  };
};

export const assertProperty = <Ts>(
  property: fc.IProperty<Ts>,
  parameters?: fc.Parameters<Ts>
): void => fc.assert(property, propertyParameters(parameters));

export const assertAsyncProperty = <Ts>(
  property: fc.IAsyncProperty<Ts>,
  parameters?: fc.Parameters<Ts>
): Promise<void> => fc.assert(property, propertyParameters(parameters));

export const seededRandom = (seed: number): (() => number) => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomSeed = fc.integer({ min: 0, max: 0x7fffffff });
