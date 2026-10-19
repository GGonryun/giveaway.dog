import { describe, expect, it } from 'vitest';
import {
  EMPTY_MODULE,
  LIVE_TEST_TIMEOUT,
  liveTestConfig,
  SERVER_SETUP,
  testProjects
} from '../projects.ts';

describe('liveTestConfig', () => {
  const { resolve, test } = liveTestConfig();

  it('runs only the live test files, in Node', () => {
    expect(test?.name).toBe('live');
    expect(test?.environment).toBe('node');
    expect(test?.include).toEqual(['**/*.live.test.ts']);
  });

  it('keeps the logs of the provider calls out of the output and never retries a call', () => {
    expect(test?.silent).toBe(true);
    expect(test?.retry).toBe(0);
    expect(test?.testTimeout).toBe(LIVE_TEST_TIMEOUT);
  });

  it('uses the default setup and replaces server-only', () => {
    expect(test?.setupFiles).toEqual([SERVER_SETUP]);
    expect(resolve?.alias).toEqual({ 'server-only': EMPTY_MODULE });
  });
});

describe('the projects of a package', () => {
  it('leave the live test files out of every project', () => {
    for (const project of testProjects()) {
      const { include = [], exclude = [] } = project.test;
      const runsLiveTests =
        include.includes('**/*.test.ts') &&
        !exclude.includes('**/*.live.test.ts');
      expect(runsLiveTests, project.test.name).toBe(false);
    }
  });
});
