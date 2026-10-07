import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { format } from 'node:util';
import { Worker } from 'node:worker_threads';

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error'];
const WORKERS = 8;
const SUPPRESSIONS_FLAGS = [
  '--prune-suppressions',
  '--suppress-all',
  '--suppress-rule'
];
const LINTED_FILE = /\.(js|mjs|cjs|ts|mts|cts)$|^package\.json$/;
const COMPONENT_FILE = /\.(jsx|tsx)$/;
const COMPONENT_WEIGHT = 3;

export const loadCli = (root) => {
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

export const captureConsole = async (run) => {
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

export const lintProject = (cli, root, projectRoot, extraArgs) =>
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

export const projectSize = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).reduce((size, entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      return size;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return size + projectSize(file);
    if (!entry.isFile()) return size;
    if (COMPONENT_FILE.test(entry.name)) {
      return size + COMPONENT_WEIGHT * fs.statSync(file).size;
    }
    if (LINTED_FILE.test(entry.name)) return size + fs.statSync(file).size;
    return size;
  }, 0);

export const toWorkerCount = (jobs, env = process.env) => {
  const writesSuppressions = jobs.some(({ args }) =>
    args.some((arg) => SUPPRESSIONS_FLAGS.includes(arg.split('=')[0]))
  );
  if (writesSuppressions) return 1;
  const requested = Number(env.LINT_WORKERS);
  const workers =
    Number.isInteger(requested) && requested > 0 ? requested : WORKERS;
  return Math.min(workers, jobs.length);
};

const toJobs = (taskGraph, inputs, context) =>
  Object.values(taskGraph.tasks)
    .map((task) => {
      const { root } =
        context.projectsConfigurations.projects[task.target.project];
      return {
        task: task.id,
        projectRoot: root,
        args: toCliArgs(inputs[task.id]),
        size: projectSize(path.join(context.root, root))
      };
    })
    .sort((a, b) => b.size - a.size);

const createChannel = () => {
  const items = [];
  let wake = () => {};
  return {
    push: (item) => {
      items.push(item);
      wake();
    },
    next: async () => {
      while (items.length === 0) {
        await new Promise((resolve) => {
          wake = resolve;
        });
      }
      return items.shift();
    }
  };
};

const startPool = (jobs, count, root, report) => {
  const queue = [...jobs];
  const workers = new Set();
  const start = () => {
    const worker = new Worker(new URL('./worker.mjs', import.meta.url), {
      workerData: { root }
    });
    workers.add(worker);
    let current;
    let startTime;
    let error;
    const dispatch = () => {
      current = queue.shift();
      startTime = Date.now();
      if (current) worker.postMessage(current);
      else worker.terminate();
    };
    worker.on('message', (message) => {
      report(message);
      dispatch();
    });
    worker.on('error', (cause) => {
      error = cause;
    });
    worker.on('exit', (code) => {
      workers.delete(worker);
      if (!current) return;
      report({
        task: current.task,
        result: {
          success: false,
          terminalOutput:
            error?.stack ?? `The lint worker stopped with exit code ${code}.`,
          startTime,
          endTime: Date.now()
        }
      });
      if (queue.length > 0) start();
    });
    dispatch();
  };
  for (let index = 0; index < count; index++) start();
  return async () => {
    queue.length = 0;
    await Promise.all([...workers].map((worker) => worker.terminate()));
  };
};

export default async function lint(options, context) {
  process.chdir(context.root);
  const cli = loadCli(context.root);
  const { root } = context.projectsConfigurations.projects[context.projectName];
  const code = await lintProject(cli, context.root, root, toCliArgs(options));
  return { success: code === 0 };
}

export async function* batch(taskGraph, inputs, overrides, context) {
  process.chdir(context.root);
  const jobs = toJobs(taskGraph, inputs, context);
  const results = createChannel();
  const stop = startPool(jobs, toWorkerCount(jobs), context.root, results.push);
  try {
    for (let done = 0; done < jobs.length; done++) {
      yield await results.next();
    }
  } finally {
    await stop();
  }
}
