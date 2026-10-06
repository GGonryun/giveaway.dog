import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';
import { Stryker } from '@stryker-mutator/core';
import type {
  MutantResult,
  PartialStrykerOptions
} from '@stryker-mutator/api/core';
import type { MutantOutcome } from './gate.ts';
import { MAX_RETRIES, mergeRetried, retryPatterns } from './retry.ts';

const [optionsFile, resultsFile] = process.argv.slice(2);

const options = JSON.parse(
  readFileSync(optionsFile, 'utf8')
) as PartialStrykerOptions;

const toOutcome = (result: MutantResult): MutantOutcome => ({
  fileName: isAbsolute(result.fileName)
    ? relative(process.cwd(), result.fileName)
    : result.fileName,
  line: result.location.start.line,
  column: result.location.start.column,
  endLine: result.location.end.line,
  mutatorName: result.mutatorName,
  replacement: result.replacement,
  status: result.status,
  testsCompleted: result.testsCompleted
});

const run = async (
  runOptions: PartialStrykerOptions
): Promise<MutantOutcome[]> =>
  (await new Stryker(runOptions).runMutationTest()).map(toOutcome);

let outcomes = await run(options);

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  const mutate = retryPatterns(outcomes);
  if (mutate.length === 0) {
    break;
  }
  console.log(
    `Running ${mutate.length} range(s) again because no test ran for some covered mutants (attempt ${attempt} of ${MAX_RETRIES})`
  );
  outcomes = mergeRetried(
    outcomes,
    await run({ ...options, mutate, reporters: [], incremental: false })
  );
}

writeFileSync(resultsFile, JSON.stringify(outcomes));
