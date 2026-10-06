import { describe, expect, it } from 'vitest';
import {
  packageTestConfig,
  RESET_MODULES,
  SERVER_SETUP,
  testProjects
} from '../projects.ts';

describe('packageTestConfig', () => {
  it('resets the modules before the default setup of each test file', () => {
    expect(packageTestConfig().test?.setupFiles).toEqual([
      RESET_MODULES,
      SERVER_SETUP
    ]);
  });

  it('resets the modules before the setup files that a package passes', () => {
    expect(packageTestConfig({ setupFiles: [] }).test?.setupFiles).toEqual([
      RESET_MODULES
    ]);
  });

  it('runs the test files of a package without isolation by default', () => {
    expect(packageTestConfig().test?.isolate).toBe(false);
  });

  it('isolates each test file when the package asks for it', () => {
    expect(packageTestConfig({ isolate: true }).test?.isolate).toBe(true);
  });
});

describe('testProjects', () => {
  it('always isolates the server tests', () => {
    const [server] = testProjects();

    expect(server.test.isolate).toBe(true);
  });

  it('gives the frontend and snapshot projects the isolation of the package', () => {
    const [, frontend, snapshot] = testProjects();

    expect(frontend.test).not.toHaveProperty('isolate');
    expect(snapshot.test).not.toHaveProperty('isolate');
  });
});
