import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import lint, { batch, toCliArgs, toEslintArgs } from '../lint.mjs';

const require = createRequire(import.meta.url);
const cwd = process.cwd();
const argv = [...process.argv];
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-executor-'));

const write = (file: string, content: string) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const suppressions = (file: string, count: number) =>
  JSON.stringify({ [file]: { 'no-var': { count } } }, null, 2);

write('package.json', JSON.stringify({ name: 'workspace', private: true }));
write(
  'eslint.config.mjs',
  "export default [{ rules: { 'no-var': 'error' } }];\n"
);
fs.mkdirSync(path.join(root, 'node_modules'));
fs.symlinkSync(
  path.dirname(require.resolve('eslint/package.json')),
  path.join(root, 'node_modules', 'eslint'),
  'dir'
);
write('packages/clean/src/clean.js', 'export const clean = 1;\n');
write('packages/broken/src/broken.js', 'var broken = 1;\nexport { broken };\n');
write('packages/baseline/src/old.js', 'var old = 1;\nexport { old };\n');
write(
  'packages/baseline/eslint-suppressions.json',
  suppressions('packages/baseline/src/old.js', 1)
);
write('packages/stale/src/old.js', 'var old = 1;\nexport { old };\n');
write(
  'packages/stale/eslint-suppressions.json',
  suppressions('packages/stale/src/old.js', 2)
);

const PROJECTS = ['clean', 'broken', 'baseline', 'stale'];

const context = {
  root,
  cwd: root,
  isVerbose: false,
  projectsConfigurations: {
    version: 2,
    projects: Object.fromEntries(
      PROJECTS.map((name) => [name, { root: `packages/${name}` }])
    )
  }
};

const taskGraphOf = (projects: string[]) => ({
  roots: projects.map((project) => `${project}:lint`),
  dependencies: Object.fromEntries(
    projects.map((project) => [`${project}:lint`, []])
  ),
  tasks: Object.fromEntries(
    projects.map((project) => [
      `${project}:lint`,
      { id: `${project}:lint`, target: { project, target: 'lint' } }
    ])
  )
});

type Result = { success: boolean; terminalOutput: string };

const runBatch = async (
  projects: string[],
  inputs: Record<string, Record<string, unknown>> = {}
) => {
  const results: Record<string, Result> = {};
  for await (const { task, result } of batch(
    taskGraphOf(projects),
    inputs,
    {},
    context
  )) {
    results[task] = result;
  }
  return results;
};

afterAll(() => {
  process.chdir(cwd);
  process.argv.splice(0, process.argv.length, ...argv);
  fs.rmSync(root, { recursive: true, force: true });
});

describe('toEslintArgs', () => {
  it('passes the eslint-suppressions.json of the project when it has one', () => {
    expect(toEslintArgs(root, 'packages/baseline')).toEqual([
      'packages/baseline',
      '--suppressions-location',
      'packages/baseline/eslint-suppressions.json'
    ]);
  });

  it('leaves the root eslint-suppressions.json to ESLint otherwise', () => {
    expect(toEslintArgs(root, 'packages/clean', ['--quiet'])).toEqual([
      'packages/clean',
      '--quiet'
    ]);
  });
});

describe('toCliArgs', () => {
  it('turns the options that Nx parsed back into ESLint flags', () => {
    expect(
      toCliArgs({
        quiet: true,
        'warn-ignored': false,
        'max-warnings': 0,
        rule: ['no-var: off', 'eqeqeq: off'],
        _: ['src/file.ts']
      })
    ).toEqual([
      '--quiet',
      '--no-warn-ignored',
      '--max-warnings',
      '0',
      '--rule',
      'no-var: off',
      '--rule',
      'eqeqeq: off',
      'src/file.ts'
    ]);
  });
});

describe('the lint executor', () => {
  it('fails a project with a lint error', async () => {
    await expect(
      lint({}, { ...context, projectName: 'broken' })
    ).resolves.toEqual({ success: false });
  });

  it('passes a project with no lint error', async () => {
    await expect(
      lint({}, { ...context, projectName: 'clean' })
    ).resolves.toEqual({ success: true });
  });
});

describe('the batch implementation', () => {
  it('reports each project with its own result and output', async () => {
    const results = await runBatch(['clean', 'broken', 'baseline']);

    expect(results['clean:lint']).toMatchObject({
      success: true,
      terminalOutput: ''
    });
    expect(results['broken:lint'].success).toBe(false);
    expect(results['broken:lint'].terminalOutput).toContain(
      path.join(root, 'packages/broken/src/broken.js')
    );
    expect(results['broken:lint'].terminalOutput).toContain('no-var');
    expect(results['baseline:lint']).toMatchObject({
      success: true,
      terminalOutput: ''
    });
  });

  it('fails a project whose eslint-suppressions.json has a suppression that no error uses', async () => {
    const results = await runBatch(['stale']);

    expect(results['stale:lint'].success).toBe(false);
    expect(results['stale:lint'].terminalOutput).toContain(
      'There are suppressions left that do not occur anymore'
    );
  });

  it('passes the options of each task to ESLint', async () => {
    const results = await runBatch(['stale'], {
      'stale:lint': { 'prune-suppressions': true }
    });

    expect(results['stale:lint'].success).toBe(true);
    expect(JSON.parse(read('packages/stale/eslint-suppressions.json'))).toEqual(
      { 'packages/stale/src/old.js': { 'no-var': { count: 1 } } }
    );
  });

  it('runs as the ESLint CLI, so @nx/eslint-plugin keeps the project graph between files', async () => {
    await runBatch(['clean']);

    expect(process.argv[1]).toBe(
      path.join(
        path.dirname(require.resolve('eslint/package.json')),
        'bin',
        'eslint.js'
      )
    );
  });
});
