import { describe, expect, it } from 'vitest';
import type { MutantOutcome } from '../gate.ts';
import {
  isInconclusive,
  MAX_RETRIES,
  mergeRetried,
  mutantKey,
  retryPatterns
} from '../retry.ts';

const mutant = (overrides: Partial<MutantOutcome> = {}): MutantOutcome => ({
  fileName: 'src/a.ts',
  line: 4,
  column: 7,
  endLine: 4,
  mutatorName: 'ConditionalExpression',
  replacement: 'true',
  status: 'Survived',
  testsCompleted: 3,
  ...overrides
});

describe('MAX_RETRIES', () => {
  it('runs inconclusive mutants two more times', () => {
    expect(MAX_RETRIES).toBe(2);
  });
});

describe('isInconclusive', () => {
  it('flags a survivor for which no test ran', () => {
    expect(isInconclusive(mutant({ testsCompleted: 0 }))).toBe(true);
  });

  it('keeps a survivor for which tests ran', () => {
    expect(isInconclusive(mutant({ testsCompleted: 1 }))).toBe(false);
  });

  it('keeps a survivor whose test count is unknown', () => {
    expect(isInconclusive(mutant({ testsCompleted: undefined }))).toBe(false);
  });

  it.each(['Killed', 'NoCoverage', 'Timeout', 'Ignored'])(
    'keeps a %s mutant for which no test ran',
    (status) => {
      expect(isInconclusive(mutant({ status, testsCompleted: 0 }))).toBe(false);
    }
  );
});

describe('mutantKey', () => {
  it('is the same for the same mutant in another run', () => {
    expect(mutantKey(mutant({ status: 'Killed', testsCompleted: 5 }))).toBe(
      mutantKey(mutant())
    );
  });

  it.each([
    ['file', { fileName: 'src/b.ts' }],
    ['line', { line: 5 }],
    ['column', { column: 8 }],
    ['mutator', { mutatorName: 'BooleanLiteral' }],
    ['replacement', { replacement: 'false' }]
  ])('differs when the %s differs', (_label, overrides) => {
    expect(mutantKey(mutant(overrides))).not.toBe(mutantKey(mutant()));
  });

  it('treats a missing replacement as empty', () => {
    expect(mutantKey(mutant({ replacement: undefined }))).toBe(
      mutantKey(mutant({ replacement: '' }))
    );
  });

  it('does not confuse fields that run together', () => {
    expect(mutantKey(mutant({ mutatorName: 'A', replacement: 'BC' }))).not.toBe(
      mutantKey(mutant({ mutatorName: 'AB', replacement: 'C' }))
    );
  });
});

describe('retryPatterns', () => {
  it('returns one line range per inconclusive mutant location', () => {
    expect(
      retryPatterns([
        mutant({ testsCompleted: 0 }),
        mutant({ testsCompleted: 0, column: 12 }),
        mutant({ testsCompleted: 0, line: 9, endLine: 11 }),
        mutant({ fileName: 'src/b.ts', testsCompleted: 0 }),
        mutant({ line: 20, endLine: 20 })
      ])
    ).toEqual(['src/a.ts:4-4', 'src/a.ts:9-11', 'src/b.ts:4-4']);
  });

  it('returns nothing when every mutant is conclusive', () => {
    expect(retryPatterns([mutant(), mutant({ status: 'Killed' })])).toEqual([]);
  });
});

describe('mergeRetried', () => {
  it('replaces inconclusive mutants with their retried outcome', () => {
    const inconclusive = mutant({ testsCompleted: 0 });
    const killed = mutant({ status: 'Killed', testsCompleted: 2 });

    expect(mergeRetried([inconclusive], [killed])).toEqual([killed]);
  });

  it('keeps conclusive mutants even when the retry has them', () => {
    const conclusive = mutant({ testsCompleted: 4 });

    expect(mergeRetried([conclusive], [mutant({ status: 'Killed' })])).toEqual([
      conclusive
    ]);
  });

  it('keeps an inconclusive mutant that the retry did not report', () => {
    const inconclusive = mutant({ testsCompleted: 0 });

    expect(mergeRetried([inconclusive], [mutant({ line: 99 })])).toEqual([
      inconclusive
    ]);
  });

  it('keeps the order of the original run', () => {
    const first = mutant({ line: 1, endLine: 1, testsCompleted: 0 });
    const second = mutant({ line: 2, endLine: 2, status: 'Killed' });
    const retriedFirst = { ...first, status: 'Killed', testsCompleted: 1 };

    expect(mergeRetried([first, second], [retriedFirst])).toEqual([
      retriedFirst,
      second
    ]);
  });
});
