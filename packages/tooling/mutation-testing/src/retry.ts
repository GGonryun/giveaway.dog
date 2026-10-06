import type { MutantOutcome } from './gate.ts';

export const MAX_RETRIES = 2;

export const mutantKey = (mutant: MutantOutcome): string =>
  [
    mutant.fileName,
    mutant.line,
    mutant.column,
    mutant.mutatorName,
    mutant.replacement ?? ''
  ].join('\u0000');

export const isInconclusive = (mutant: MutantOutcome): boolean =>
  mutant.status === 'Survived' && mutant.testsCompleted === 0;

export const retryPatterns = (mutants: MutantOutcome[]): string[] => [
  ...new Set(
    mutants
      .filter(isInconclusive)
      .map((mutant) => `${mutant.fileName}:${mutant.line}-${mutant.endLine}`)
  )
];

export const mergeRetried = (
  mutants: MutantOutcome[],
  retried: MutantOutcome[]
): MutantOutcome[] => {
  const byKey = new Map(retried.map((mutant) => [mutantKey(mutant), mutant]));
  return mutants.map((mutant) =>
    isInconclusive(mutant) ? (byKey.get(mutantKey(mutant)) ?? mutant) : mutant
  );
};
