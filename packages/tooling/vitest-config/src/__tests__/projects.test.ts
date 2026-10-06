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
  const project = (name: string) => {
    const found = testProjects().find((entry) => entry.test.name === name);
    if (!found) {
      throw new Error(`No ${name} project`);
    }
    return found;
  };

  it('always isolates the server and property tests', () => {
    expect(project('server').test.isolate).toBe(true);
    expect(project('property').test.isolate).toBe(true);
  });

  it('gives the frontend and snapshot projects the isolation of the package', () => {
    expect(project('frontend').test).not.toHaveProperty('isolate');
    expect(project('snapshot').test).not.toHaveProperty('isolate');
  });
});
