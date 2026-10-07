import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import lint, {
  batch,
  projectSize,
  toCliArgs,
  toEslintArgs,
  toWorkerCount
} from '../lint.mjs';

const require = createRequire(import.meta.url);
const cwd = process.cwd();
const argv = [...process.argv];
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-executor-'));
const eslintBin = path.join(
  path.dirname(require.resolve('eslint/package.json')),
  'bin',
  'eslint.js'
);

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
  `import { threadId } from 'node:worker_threads';

const report = (message) => ({
  create: (context) => ({
    Program: (node) => context.report({ node, message: message() })
  })
});

const probe = {
  rules: {
    thread: report(() => \`thread \${threadId}\`),
    argv: report(() => \`argv \${process.argv[1]}\`),
    exit: { create: () => ({ Program: () => process.exit(3) }) }
  }
};

export default [
  { rules: { 'no-var': 'error' } },
  {
    files: ['packages/thread-*/**'],
    plugins: { probe },
    rules: { 'probe/thread': 'warn' }
  },
  {
    files: ['packages/argv/**'],
    plugins: { probe },
    rules: { 'probe/argv': 'warn' }
  },
  {
    files: ['packages/crash/**'],
    plugins: { probe },
    rules: { 'probe/exit': 'error' }
  }
];
`
);
fs.mkdirSync(path.join(root, 'node_modules'));
fs.symlinkSync(
  path.dirname(require.resolve('eslint/package.json')),
  path.join(root, 'node_modules', 'eslint'),
  'dir'
);
write('packages/clean/src/clean.js', 'export const clean = 1;\n');
write('packages/broken/src/broken.js', 'var broken = 1;\nexport { broken };\n');
write(
  'packages/invalid/src/invalid.js',
  'var invalid = 1;\nexport { invalid };\n'
);
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
write('packages/thread-a/src/a.js', 'export const a = 1;\n');
write('packages/thread-b/src/b.js', 'export const b = 1;\n');
write('packages/argv/src/argv.js', 'export const argv = 1;\n');
write(
  'packages/crash/src/crash.js',
  `export const crash = '${'x'.repeat(200)}';\n`
);
write('packages/small/src/small.js', 'export const s = 1;\n');
write(
  'packages/medium/src/medium.js',
  `export const m = '${'x'.repeat(40)}';\n`
);
write('packages/large/src/large.js', `export const l = '${'x'.repeat(80)}';\n`);
write('sizes/a.ts', 'x'.repeat(10));
write('sizes/b.tsx', 'x'.repeat(10));
write('sizes/package.json', 'x'.repeat(5));
write('sizes/src/c.mjs', 'x'.repeat(7));
write('sizes/README.md', 'x'.repeat(100));
write('sizes/node_modules/d.js', 'x'.repeat(100));
write('sizes/.next/e.js', 'x'.repeat(100));

const PROJECTS = [
  'clean',
  'broken',
  'invalid',
  'baseline',
  'stale',
  'thread-a',
  'thread-b',
  'argv',
  'crash',
  'small',
  'medium',
  'large'
];

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

type Result = {
  success: boolean;
  terminalOutput: string;
  startTime: number;
  endTime: number;
};

const collectBatch = async (
  projects: string[],
  inputs: Record<string, Record<string, unknown>> = {}
) => {
  const yielded: { task: string; result: Result }[] = [];
  for await (const item of batch(taskGraphOf(projects), inputs, {}, context)) {
    yielded.push(item);
  }
  return yielded;
};

const runBatch = async (
  projects: string[],
  inputs: Record<string, Record<string, unknown>> = {}
) =>
  Object.fromEntries(
    (await collectBatch(projects, inputs)).map(({ task, result }) => [
      task,
      result
    ])
  ) as Record<string, Result>;

const threadOf = (result: Result) => {
  const threads = [...result.terminalOutput.matchAll(/thread (\d+)/g)];
  expect(threads).toHaveLength(1);
  return threads[0][1];
};

const jobsWith = (...args: string[][]) =>
  args.map((jobArgs) => ({ args: jobArgs }));

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(path.join(root, 'eslint-suppressions.json'), { force: true });
});

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

describe('projectSize', () => {
  it('adds up the bytes of the linted files, with three times the bytes of the component files', () => {
    expect(projectSize(path.join(root, 'sizes'))).toBe(10 + 3 * 10 + 5 + 7);
  });
});

describe('toWorkerCount', () => {
  it('starts 8 workers', () => {
    expect(toWorkerCount(jobsWith(...Array(20).fill([])), {})).toBe(8);
  });

  it('never starts more workers than tasks', () => {
    expect(toWorkerCount(jobsWith([], []), {})).toBe(2);
  });

  it('starts the number of workers in LINT_WORKERS', () => {
    expect(
      toWorkerCount(jobsWith(...Array(20).fill([])), { LINT_WORKERS: '3' })
    ).toBe(3);
  });

  it.each(['0', '-2', '1.5', 'many'])(
    'ignores LINT_WORKERS=%s',
    (LINT_WORKERS) => {
      expect(
        toWorkerCount(jobsWith(...Array(20).fill([])), { LINT_WORKERS })
      ).toBe(8);
    }
  );

  it.each([
    ['--prune-suppressions'],
    ['--suppress-all'],
    ['--suppress-rule', 'no-var'],
    ['--suppress-rule=no-var']
  ])(
    'starts one worker when a task writes the suppressions (%s)',
    (...flag) => {
      expect(toWorkerCount(jobsWith([], flag, []), { LINT_WORKERS: '4' })).toBe(
        1
      );
    }
  );
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

  it('reports every task once', async () => {
    vi.stubEnv('LINT_WORKERS', '3');
    const projects = PROJECTS.filter((project) => project !== 'crash');

    const yielded = await collectBatch(projects);

    expect(yielded.map(({ task }) => task).sort()).toEqual(
      projects.map((project) => `${project}:lint`).sort()
    );
    for (const { result } of yielded) {
      expect(result.endTime).toBeGreaterThanOrEqual(result.startTime);
    }
  });

  it('lints the projects in more than one worker', async () => {
    const results = await runBatch(['thread-a', 'thread-b']);

    expect(threadOf(results['thread-a:lint'])).not.toBe(
      threadOf(results['thread-b:lint'])
    );
  });

  it.each(['1', '2'])(
    'keeps the output of each task apart with LINT_WORKERS=%s',
    async (workers) => {
      vi.stubEnv('LINT_WORKERS', workers);
      const results = await runBatch(['broken', 'invalid']);

      expect(results['broken:lint'].terminalOutput).toContain('broken.js');
      expect(results['broken:lint'].terminalOutput).not.toContain('invalid.js');
      expect(results['invalid:lint'].terminalOutput).toContain('invalid.js');
      expect(results['invalid:lint'].terminalOutput).not.toContain('broken.js');
    }
  );

  it('lints the largest projects first', async () => {
    vi.stubEnv('LINT_WORKERS', '1');

    const yielded = await collectBatch(['small', 'large', 'medium']);

    expect(yielded.map(({ task }) => task)).toEqual([
      'large:lint',
      'medium:lint',
      'small:lint'
    ]);
  });

  it.each([
    { 'prune-suppressions': true },
    { 'suppress-all': true },
    { 'suppress-rule': 'no-var' }
  ])('lints one project at a time with %o', async (options) => {
    const results = await runBatch(['thread-a', 'thread-b'], {
      'thread-a:lint': options,
      'thread-b:lint': options
    });

    expect(threadOf(results['thread-a:lint'])).toBe(
      threadOf(results['thread-b:lint'])
    );
  });

  it('fails only the task whose worker stops, and lints the other projects', async () => {
    vi.stubEnv('LINT_WORKERS', '1');

    const yielded = await collectBatch(['clean', 'crash', 'broken']);
    const results = Object.fromEntries(
      yielded.map(({ task, result }) => [task, result])
    );

    expect(yielded.map(({ task }) => task)).toEqual([
      'crash:lint',
      'broken:lint',
      'clean:lint'
    ]);
    expect(results['crash:lint']).toMatchObject({
      success: false,
      terminalOutput: 'The lint worker stopped with exit code 3.'
    });
    expect(results['broken:lint'].success).toBe(false);
    expect(results['broken:lint'].terminalOutput).toContain('no-var');
    expect(results['clean:lint'].success).toBe(true);
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

  it('runs each worker as the ESLint CLI, so @nx/eslint-plugin keeps the project graph between files', async () => {
    const results = await runBatch(['argv']);

    expect(results['argv:lint'].terminalOutput).toContain(`argv ${eslintBin}`);
  });
});
