import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { formatAuditReport, reportFolderName } from './audit.ts';
import {
  findAddedLines,
  parseChangedLines,
  type AddedLine,
  type LineRange
} from './changed-lines.ts';
import {
  DISABLE_COMMENT,
  evaluateGate,
  formatGateSummary,
  gatePasses,
  type MutantOutcome
} from './gate.ts';
import { pickPackages } from './pick-packages.ts';
import { strykerOptions, type MutationRunOptions } from './stryker-options.ts';
import {
  isMutableFile,
  toMutatePatterns,
  toPackageTargets
} from './targets.ts';

const USAGE = `Usage:
  node packages/tooling/mutation-testing/src/cli.ts changed [--base <ref>]
  node packages/tooling/mutation-testing/src/cli.ts package <name or dir> [--incremental]
  node packages/tooling/mutation-testing/src/cli.ts pick [--count <n>] [--seed <text>]`;

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8'
}).trim();

const RUNNER = fileURLToPath(new URL('./run-stryker.ts', import.meta.url));

const REPORTS_DIR = join(ROOT, 'reports', 'mutation');

const git = (...args: string[]): string =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

const writeStepSummary = (markdown: string): void => {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) {
    appendFileSync(file, `${markdown}\n`);
  }
};

const readPackageName = (packageDir: string): string =>
  (
    JSON.parse(
      readFileSync(join(ROOT, packageDir, 'package.json'), 'utf8')
    ) as {
      name: string;
    }
  ).name;

const reportDirOf = (packageName: string): string =>
  join(REPORTS_DIR, reportFolderName(packageName));

const runStryker = (
  packageDir: string,
  options: MutationRunOptions
): MutantOutcome[] => {
  const workDir = mkdtempSync(join(tmpdir(), 'mutation-'));
  try {
    const optionsFile = join(workDir, 'options.json');
    const resultsFile = join(workDir, 'results.json');
    writeFileSync(optionsFile, JSON.stringify(strykerOptions(options)));

    const run = spawnSync(
      process.execPath,
      [RUNNER, optionsFile, resultsFile],
      { cwd: join(ROOT, packageDir), stdio: 'inherit' }
    );
    if (run.status !== 0 || !existsSync(resultsFile)) {
      throw new Error(
        `Stryker failed in ${packageDir} with exit code ${run.status}`
      );
    }
    return JSON.parse(readFileSync(resultsFile, 'utf8')) as MutantOutcome[];
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
};

const readLines = (file: string): string[] =>
  readFileSync(join(ROOT, file), 'utf8').split('\n');

const changesSince = (
  base: string
): { changed: Map<string, LineRange[]>; disableComments: AddedLine[] } => {
  const diff = git(
    'diff',
    '--unified=0',
    '--no-color',
    '--no-ext-diff',
    base,
    '--',
    'packages'
  );
  const changed = parseChangedLines(diff);
  const disableComments = findAddedLines(diff, DISABLE_COMMENT);

  const untracked = git(
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    'packages'
  )
    .split('\n')
    .filter(isMutableFile);
  for (const file of untracked) {
    const lines = readLines(file);
    changed.set(file, [{ start: 1, end: lines.length }]);
    lines.forEach((text, index) => {
      if (DISABLE_COMMENT.test(text)) {
        disableComments.push({ file, line: index + 1, text: text.trim() });
      }
    });
  }

  return {
    changed,
    disableComments: disableComments.filter((comment) =>
      isMutableFile(comment.file)
    )
  };
};

const defaultBase = (): string =>
  process.env.NX_BASE ?? git('merge-base', 'origin/main', 'HEAD').trim();

const runChanged = (base: string): number => {
  const { changed, disableComments } = changesSince(base);
  const targets = toPackageTargets(changed);
  const reports = targets.map((target) => {
    const packageName = readPackageName(target.packageDir);
    console.log(`\nMutating the changed lines of ${packageName}`);
    const mutants = runStryker(target.packageDir, {
      mutate: toMutatePatterns(target.files),
      reportDir: reportDirOf(packageName)
    });
    return evaluateGate(
      { packageDir: target.packageDir, mutants },
      target.files
    );
  });

  const summary = formatGateSummary(reports, disableComments);
  console.log(`\n${summary}`);
  writeStepSummary(summary);
  return gatePasses(reports) ? 0 : 1;
};

const listPackageDirs = (dir = 'packages'): string[] => {
  if (existsSync(join(ROOT, dir, 'package.json'))) {
    return [dir];
  }
  return readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name !== 'node_modules' &&
        `${dir}/${entry.name}` !== 'packages/tooling'
    )
    .flatMap((entry) => listPackageDirs(`${dir}/${entry.name}`));
};

const mutableFilesOf = (packageDir: string): string[] => {
  const srcDir = join(ROOT, packageDir, 'src');
  if (!existsSync(srcDir)) {
    return [];
  }
  return readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .map((file) => `src/${file}`)
    .filter((file) => isMutableFile(`${packageDir}/${file}`))
    .sort();
};

const hasMutableFiles = (packageDir: string): boolean =>
  existsSync(join(ROOT, packageDir, 'vitest.config.ts')) &&
  mutableFilesOf(packageDir).length > 0;

const resolvePackageDir = (nameOrDir: string): string => {
  const dirs = listPackageDirs();
  const dir =
    dirs.find((candidate) => candidate === nameOrDir.replace(/\/$/, '')) ??
    dirs.find((candidate) => readPackageName(candidate) === nameOrDir) ??
    dirs.find(
      (candidate) => readPackageName(candidate) === `@giveaway/${nameOrDir}`
    );
  if (!dir) {
    throw new Error(`No package named or located at ${nameOrDir}`);
  }
  return dir;
};

const runPackage = (nameOrDir: string, incremental: boolean): number => {
  const packageDir = resolvePackageDir(nameOrDir);
  const packageName = readPackageName(packageDir);
  const reportDir = reportDirOf(packageName);
  mkdirSync(reportDir, { recursive: true });

  const mutants = runStryker(packageDir, {
    mutate: mutableFilesOf(packageDir),
    reportDir,
    ...(incremental
      ? { incrementalFile: join(reportDir, 'stryker-incremental.json') }
      : {})
  });

  const runUrl =
    process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
      ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  const report = formatAuditReport({
    packageName,
    packageDir,
    mutants,
    runUrl
  });
  const survivors = mutants.filter(
    (mutant) => mutant.status === 'Survived' || mutant.status === 'NoCoverage'
  ).length;

  writeFileSync(join(reportDir, 'report.md'), report);
  writeFileSync(
    join(reportDir, 'result.json'),
    JSON.stringify({ packageName, packageDir, survivors })
  );
  console.log(`\n${report}`);
  console.log(`HTML report: ${join(reportDir, 'mutation.html')}`);
  writeStepSummary(report);
  return 0;
};

const runPick = (count: number, seed: string): number => {
  const candidates = listPackageDirs().filter(hasMutableFiles);
  console.log(JSON.stringify(pickPackages(candidates, count, seed)));
  return 0;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: 'string' },
    incremental: { type: 'boolean', default: false },
    count: { type: 'string', default: '3' },
    seed: { type: 'string', default: new Date().toISOString().slice(0, 10) }
  }
});

const [command, target] = positionals;

const exitCode = (() => {
  if (command === 'changed') {
    return runChanged(values.base ?? defaultBase());
  }
  if (command === 'package' && target) {
    return runPackage(target, values.incremental);
  }
  if (command === 'pick') {
    return runPick(Number(values.count), values.seed);
  }
  console.error(USAGE);
  return 2;
})();

process.exit(exitCode);
