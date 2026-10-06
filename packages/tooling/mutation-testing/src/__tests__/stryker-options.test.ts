import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strykerOptions } from '../stryker-options.ts';

describe('strykerOptions', () => {
  const defaultOptions = () =>
    strykerOptions({
      mutate: ['src/a.ts:1-2'],
      reportDir: '/reports/x-server'
    });

  it('runs the package tests with Vitest and per-test coverage', () => {
    expect(defaultOptions()).toMatchObject({
      testRunner: 'vitest',
      vitest: { configFile: 'vitest.config.ts' },
      coverageAnalysis: 'perTest',
      mutate: ['src/a.ts:1-2'],
      ignorers: ['console']
    });
  });

  it('loads the Vitest runner and the console ignorer by file URL', () => {
    expect(defaultOptions().plugins).toEqual([
      expect.stringMatching(/^file:\/\/.*\/src\/vitest-runner\.ts$/),
      expect.stringMatching(/^file:\/\/.*\/src\/ignore-console\.ts$/)
    ]);
  });

  it('writes the HTML and JSON reports to the report folder', () => {
    expect(defaultOptions()).toMatchObject({
      reporters: ['html', 'json', 'progress-append-only'],
      htmlReporter: { fileName: '/reports/x-server/mutation.html' },
      jsonReporter: { fileName: '/reports/x-server/mutation.json' }
    });
  });

  it('never breaks the run on the score', () => {
    expect(defaultOptions().thresholds).toEqual({
      high: 100,
      low: 80,
      break: null
    });
  });

  it('allows ten seconds per mutant', () => {
    expect(defaultOptions().timeoutMS).toBe(10000);
  });

  it('keeps the sandbox outside the repository and always removes it', () => {
    expect(defaultOptions()).toMatchObject({
      tempDirName: join(tmpdir(), 'giveaway-stryker'),
      cleanTempDir: 'always'
    });
  });

  it('is not incremental and keeps the default concurrency by default', () => {
    expect(defaultOptions().incremental).toBe(false);
    expect(defaultOptions()).not.toHaveProperty('incrementalFile');
    expect(defaultOptions()).not.toHaveProperty('concurrency');
  });

  it('is incremental when an incremental file is given', () => {
    expect(
      strykerOptions({
        mutate: [],
        reportDir: '/r',
        incrementalFile: '/r/stryker-incremental.json'
      })
    ).toMatchObject({
      incremental: true,
      incrementalFile: '/r/stryker-incremental.json'
    });
  });

  it('uses the given concurrency', () => {
    expect(
      strykerOptions({ mutate: [], reportDir: '/r', concurrency: 2 })
    ).toMatchObject({ concurrency: 2 });
  });
});
