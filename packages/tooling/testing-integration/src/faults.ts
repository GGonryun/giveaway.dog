import { isDeepStrictEqual } from 'node:util';
import { db, resetDatabase } from './database';

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
  '$executeRaw',
  '$executeRawUnsafe'
]);

export class SimulatedCrash extends Error {
  constructor() {
    super('The function stopped here (simulated crash)');
    this.name = 'SimulatedCrash';
  }
}

const counter = { writes: 0, crashAfter: Infinity, crashed: false };

export const crashes = {
  reset() {
    counter.writes = 0;
    counter.crashAfter = Infinity;
    counter.crashed = false;
  },
  afterWrites(count: number) {
    counter.writes = 0;
    counter.crashAfter = count;
    counter.crashed = false;
  },
  writes: () => counter.writes,
  crashed: () => counter.crashed
};

export const crashableDb = db.$extends({
  query: {
    async $allOperations({ operation, args, query }) {
      if (counter.crashed) {
        throw new SimulatedCrash();
      }
      if (!WRITE_OPERATIONS.has(operation)) {
        return query(args);
      }
      if (counter.writes >= counter.crashAfter) {
        counter.crashed = true;
        throw new SimulatedCrash();
      }
      const result = await query(args);
      counter.writes += 1;
      if (counter.writes >= counter.crashAfter) {
        counter.crashed = true;
        throw new SimulatedCrash();
      }
      return result;
    }
  }
});

export type CrashMismatch<S> = {
  afterWrites: number;
  crashed: boolean;
  rerunError?: string;
  state: S;
};

export const crashAtEveryWrite = async <C, S>({
  setup,
  run,
  recover,
  state
}: {
  setup: () => Promise<C>;
  run: (context: C) => Promise<unknown>;
  recover?: (context: C) => Promise<unknown>;
  state: (context: C) => Promise<S>;
}) => {
  await resetDatabase();
  crashes.reset();
  const clean = await setup();
  await run(clean);
  const writes = crashes.writes();
  const expected = await state(clean);

  const mismatches: CrashMismatch<S>[] = [];
  for (let afterWrites = 0; afterWrites <= writes; afterWrites++) {
    await resetDatabase();
    crashes.reset();
    const context = await setup();
    crashes.afterWrites(afterWrites);
    await run(context).catch(() => undefined);
    const crashed = crashes.crashed();
    crashes.reset();
    await recover?.(context);
    const rerunError = await run(context).then(
      () => undefined,
      (error: unknown) => String(error)
    );
    const actual = await state(context);
    if (!crashed || rerunError || !isDeepStrictEqual(actual, expected)) {
      mismatches.push({
        afterWrites,
        crashed,
        ...(rerunError && { rerunError }),
        state: actual
      });
    }
  }

  return { writes, expected, mismatches };
};
