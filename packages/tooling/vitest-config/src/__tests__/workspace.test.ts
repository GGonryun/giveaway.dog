import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { workspaceProjects } from '../workspace.ts';

const writeFile = (file: string, content = '') => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const addPackage = (directory: string, name: string, withConfig = true) => {
  writeFile(path.join(directory, 'package.json'), JSON.stringify({ name }));
  if (withConfig) {
    writeFile(path.join(directory, 'vitest.config.ts'));
  }
};

describe('workspaceProjects', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-config-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('defines the server, property, frontend and snapshot projects for each package', () => {
    addPackage(path.join(root, 'apps/web'), 'web');
    addPackage(path.join(root, 'packages/ui/ui-button'), '@giveaway/ui-button');

    const projects = workspaceProjects(root, ['apps/web', 'packages']);

    expect(projects.map((project) => project.test?.name)).toEqual([
      'web:server',
      'web:property',
      'web:frontend',
      'web:snapshot',
      '@giveaway/ui-button:server',
      '@giveaway/ui-button:property',
      '@giveaway/ui-button:frontend',
      '@giveaway/ui-button:snapshot'
    ]);
  });

  it('extends the config file of the package and runs in its folder', () => {
    const directory = path.join(root, 'packages/ui/ui-button');
    addPackage(directory, '@giveaway/ui-button');

    const [server] = workspaceProjects(root, ['packages']);

    expect(server).toMatchObject({
      extends: path.join(directory, 'vitest.config.ts'),
      root: directory,
      test: {
        name: '@giveaway/ui-button:server',
        environment: 'node',
        include: ['**/*.test.ts']
      }
    });
  });

  it('leaves the integration and property tests out of the server project', () => {
    addPackage(path.join(root, 'packages/ui/ui-button'), '@giveaway/ui-button');

    const [server] = workspaceProjects(root, ['packages']);

    expect(server.test?.exclude).toContain('**/*.integration.test.ts');
    expect(server.test?.exclude).toContain('**/*.property.test.ts');
  });

  it('runs only the property tests in the property project, in Node', () => {
    addPackage(path.join(root, 'packages/ui/ui-button'), '@giveaway/ui-button');

    const [, property] = workspaceProjects(root, ['packages']);

    expect(property.test).toMatchObject({
      name: '@giveaway/ui-button:property',
      environment: 'node',
      include: ['**/*.property.test.ts']
    });
  });

  it('skips packages without a config file and node_modules folders', () => {
    addPackage(path.join(root, 'packages/tooling/tsconfig'), 'tsconfig', false);
    addPackage(
      path.join(root, 'packages/ui/node_modules/dependency'),
      'dependency'
    );

    expect(workspaceProjects(root, ['packages'])).toEqual([]);
  });

  it('skips folders that do not exist', () => {
    expect(workspaceProjects(root, ['tools'])).toEqual([]);
  });

  it('fails when a package has no name', () => {
    writeFile(path.join(root, 'packages/broken/package.json'), '{}');
    writeFile(path.join(root, 'packages/broken/vitest.config.ts'));

    expect(() => workspaceProjects(root, ['packages'])).toThrow(
      `${path.join(root, 'packages/broken/package.json')} has no name`
    );
  });

  it('runs the tests in UTC', () => {
    process.env.TZ = 'America/New_York';

    workspaceProjects(root, ['packages']);

    expect(process.env.TZ).toBe('UTC');
  });
});
