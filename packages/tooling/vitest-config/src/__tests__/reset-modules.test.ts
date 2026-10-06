import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const FIXTURE = fileURLToPath(new URL('./fixtures/isolation', import.meta.url));

const VITEST = path.join(
  path.dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
  'vitest.mjs'
);

const runFixture = (resetModules: boolean) => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST'))
  );
  const result = spawnSync(
    process.execPath,
    [VITEST, 'run', '--config', 'fixture.config.ts'],
    {
      cwd: FIXTURE,
      encoding: 'utf8',
      env: {
        ...env,
        FIXTURE_RESET_MODULES: String(resetModules),
        NO_COLOR: '1'
      }
    }
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

describe('reset-modules', () => {
  it('gives each test file its own mocks, setup hooks, timers, globals and variables when two files share a worker', () => {
    const { status, output } = runFixture(true);

    expect(output).toMatch(/Tests\s+6 passed/);
    expect(status).toBe(0);
  }, 60_000);

  it('is needed: without it, the second file in the worker fails each check', () => {
    const { status, output } = runFixture(false);

    expect(output).toMatch(/Tests\s+3 failed \| 3 passed/);
    for (const test of [
      'runs the hooks of the setup files before its first test',
      'reads the mock of this file',
      'starts with real timers and no stubbed global or variable'
    ]) {
      expect(output).toMatch(
        new RegExp(`FAIL\\s+\\w+\\.fixture\\.ts > ${test}`)
      );
    }
    expect(status).toBe(1);
  }, 60_000);
});
