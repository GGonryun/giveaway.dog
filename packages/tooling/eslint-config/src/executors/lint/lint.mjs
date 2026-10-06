import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { format } from 'node:util';

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error'];

const loadCli = (root) => {
  const require = createRequire(path.join(root, 'package.json'));
  const eslintRoot = path.dirname(require.resolve('eslint/package.json'));
  process.argv[1] = path.join(eslintRoot, 'bin', 'eslint.js');
  return require(path.join(eslintRoot, 'lib', 'cli.js'));
};

export const toEslintArgs = (root, projectRoot, extraArgs = []) => {
  const suppressions = path.join(projectRoot, 'eslint-suppressions.json');
  return [
    projectRoot,
    ...(fs.existsSync(path.join(root, suppressions))
      ? ['--suppressions-location', suppressions]
      : []),
    ...extraArgs
  ];
};

const captureConsole = async (run) => {
  const original = CONSOLE_METHODS.map((method) => console[method]);
  const lines = [];
  for (const method of CONSOLE_METHODS) {
    console[method] = (...args) => lines.push(format(...args));
  }
  try {
    const value = await run();
    return { value, output: lines.join('\n') };
  } catch (error) {
    lines.push(error?.stack ?? String(error));
    return { value: 2, output: lines.join('\n') };
  } finally {
    CONSOLE_METHODS.forEach((method, index) => {
      console[method] = original[index];
    });
  }
};

const lintProject = (cli, root, projectRoot, extraArgs) =>
  cli.execute([
    'node',
    'eslint',
    ...toEslintArgs(root, projectRoot, extraArgs)
  ]);

export const toCliArgs = (options = {}) =>
  Object.entries(options).flatMap(([name, value]) => {
    if (name === '_') return [value].flat().map(String);
    if (value === true) return [`--${name}`];
    if (value === false) return [`--no-${name}`];
    return [value].flat().flatMap((item) => [`--${name}`, String(item)]);
  });

export default async function lint(options, context) {
  process.chdir(context.root);
  const cli = loadCli(context.root);
  const { root } = context.projectsConfigurations.projects[context.projectName];
  const code = await lintProject(cli, context.root, root, toCliArgs(options));
  return { success: code === 0 };
}

export async function* batch(taskGraph, inputs, overrides, context) {
  process.chdir(context.root);
  const cli = loadCli(context.root);
  for (const task of Object.values(taskGraph.tasks)) {
    const { root } =
      context.projectsConfigurations.projects[task.target.project];
    const startTime = Date.now();
    const { value: code, output } = await captureConsole(() =>
      lintProject(cli, context.root, root, toCliArgs(inputs[task.id]))
    );
    yield {
      task: task.id,
      result: {
        success: code === 0,
        terminalOutput: output,
        startTime,
        endTime: Date.now()
      }
    };
  }
}
