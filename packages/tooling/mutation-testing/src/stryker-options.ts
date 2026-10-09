import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PartialStrykerOptions } from '@stryker-mutator/api/core';

export type MutationRunOptions = {
  mutate: string[];
  reportDir: string;
  incrementalFile?: string;
  concurrency?: number;
};

export const strykerOptions = ({
  mutate,
  reportDir,
  incrementalFile,
  concurrency
}: MutationRunOptions): PartialStrykerOptions => ({
  testRunner: 'vitest',
  plugins: [
    new URL('./vitest-runner.ts', import.meta.url).href,
    new URL('./ignore-console.ts', import.meta.url).href,
    new URL('./ignore-procedure-name.ts', import.meta.url).href
  ],
  vitest: { configFile: 'vitest.config.ts' },
  mutate,
  ignorers: ['console', 'procedure-name'],
  coverageAnalysis: 'perTest',
  reporters: ['html', 'json', 'progress-append-only'],
  htmlReporter: { fileName: join(reportDir, 'mutation.html') },
  jsonReporter: { fileName: join(reportDir, 'mutation.json') },
  incremental: incrementalFile !== undefined,
  ...(incrementalFile === undefined ? {} : { incrementalFile }),
  ...(concurrency === undefined ? {} : { concurrency }),
  thresholds: { high: 100, low: 80, break: null },
  timeoutMS: 10000,
  tempDirName: join(tmpdir(), 'giveaway-stryker'),
  cleanTempDir: 'always'
});
