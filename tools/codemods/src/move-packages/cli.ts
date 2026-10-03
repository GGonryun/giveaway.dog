#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { movePackages, summarize } from './move-packages.ts';
import { MoveError } from './plan.ts';

const USAGE = `Usage: pnpm run move-packages [options] <package>...

Moves packages from apps/web to packages/ as docs/monorepo/package-map.json
describes them, and rewrites every import of the moved files.

Options:
  --rename <source>=<name>  Give a source a new name in the package's src/
                            folder, for example types/index.ts=recursive-required.ts.
                            Repeat it for each rename
  --dry-run                 Print what would move and change nothing
  --skip-install            Do not run pnpm install at the end
  --root <dir>              The repository root (default: found from the
                            current directory)
  --help                    Print this help`;

const findRoot = (start: string) => {
  for (let dir = path.resolve(start); ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    if (path.dirname(dir) === dir) {
      throw new Error(`no pnpm-workspace.yaml above ${start}`);
    }
  }
};

const parseRenames = (values: string[]) =>
  Object.fromEntries(
    values.map((value) => {
      const index = value.indexOf('=');
      if (index <= 0 || index === value.length - 1) {
        throw new Error(`--rename ${value}: use <source>=<name>`);
      }
      return [value.slice(0, index), value.slice(index + 1)];
    })
  );

const main = async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      rename: { type: 'string', multiple: true, default: [] },
      'dry-run': { type: 'boolean', default: false },
      'skip-install': { type: 'boolean', default: false },
      root: { type: 'string' },
      help: { type: 'boolean', default: false }
    }
  });
  if (values.help || !positionals.length) {
    console.log(USAGE);
    process.exitCode = values.help ? 0 : 1;
    return;
  }
  const root = values.root
    ? path.resolve(values.root)
    : findRoot(process.env.INIT_CWD ?? process.cwd());
  const { plan } = await movePackages({
    root,
    packages: positionals,
    renames: parseRenames(values.rename),
    install: !values['skip-install'],
    dryRun: values['dry-run']
  });
  plan.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
  console.log(summarize(plan));
  if (values['dry-run']) {
    for (const move of plan.moves) console.log(`  ${move.from} -> ${move.to}`);
  }
};

main().catch((error: unknown) => {
  if (error instanceof MoveError) {
    console.error('The codemod changed nothing, because:');
    error.problems.forEach((problem) => console.error(`  ${problem}`));
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
