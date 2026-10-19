import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOCKFILE = 'pnpm-lock.yaml';
const ALWAYS = [
  '.nvmrc',
  '.github/workflows/live-api.yml',
  '.github/scripts/live-api-plan.mjs'
];
const EXTENSIONS = ['', '.ts', '.tsx', '.mts', '.mjs', '.js', '/index.ts'];
const IMPORT =
  /(?:^|[;\s])(?:import|export)\s+(type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 256 * 1024 * 1024
  });

const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};

const readPackages = () => {
  const packages = new Map();
  for (const file of git('ls-files', '*package.json').split('\n')) {
    if (!file.startsWith('packages/') || !file.endsWith('/package.json')) {
      continue;
    }
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    packages.set(json.name, { ...json, dir: path.dirname(file) });
  }
  return packages;
};

const packageName = (specifier) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');

const resolveFile = (base) =>
  EXTENSIONS.map((extension) => `${base}${extension}`).find(
    (file) => fs.existsSync(file) && fs.statSync(file).isFile()
  );

const ownerOf = (packages, file) =>
  [...packages.values()].find((json) => file.startsWith(`${json.dir}/`));

const resolveWorkspace = (packages, specifier) => {
  const json = packages.get(packageName(specifier));
  if (!json) return undefined;
  const subpath = specifier.slice(json.name.length);
  const target = json.exports?.[`.${subpath}`];
  if (typeof target !== 'string') return undefined;
  return resolveFile(path.join(json.dir, target));
};

const traceLiveCheck = (packages, live) => {
  const entries = git('ls-files', live.dir)
    .split('\n')
    .filter(
      (file) =>
        file.endsWith('.live.test.ts') ||
        file.endsWith('/vitest.live.config.ts')
    );
  const files = new Set();
  const npm = new Map();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift();
    if (files.has(file)) continue;
    files.add(file);
    const source = fs.readFileSync(file, 'utf8');
    const specifiers = [
      ...[...source.matchAll(IMPORT)]
        .filter((match) => !match[1])
        .map((match) => match[2]),
      ...[...source.matchAll(DYNAMIC_IMPORT)].map((match) => match[1])
    ];
    for (const specifier of specifiers) {
      if (specifier.startsWith('node:')) continue;
      if (specifier.startsWith('.')) {
        const resolved = resolveFile(path.join(path.dirname(file), specifier));
        if (resolved) queue.push(resolved);
        continue;
      }
      const resolved = resolveWorkspace(packages, specifier);
      if (resolved) {
        queue.push(resolved);
        continue;
      }
      if (packages.has(packageName(specifier))) continue;
      const owner = ownerOf(packages, file);
      if (!owner) continue;
      const names = npm.get(owner.dir) ?? new Set();
      names.add(packageName(specifier));
      npm.set(owner.dir, names);
    }
  }
  return { files, npm };
};

const lockfileEntry = (lockfile, dir, name) => {
  if (!lockfile) return null;
  const lines = lockfile.split('\n');
  const start = lines.indexOf(`  ${dir}:`);
  if (start === -1) return null;
  const keys = [`      ${name}:`, `      '${name}':`];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^ {0,2}\S/.test(line)) return null;
    if (keys.includes(line)) {
      let end = index + 1;
      while (end < lines.length && /^ {8}/.test(lines[end])) end += 1;
      return lines.slice(index, end).join('\n');
    }
  }
  return null;
};

const reasonFor = (trace, changed, lockfiles) => {
  const always = changed.find((file) => ALWAYS.includes(file));
  if (always) return `${always} changed`;
  const file = changed.find((file) => trace.files.has(file));
  if (file) return `${file} changed`;
  if (changed.includes(LOCKFILE)) {
    for (const [dir, names] of trace.npm) {
      for (const name of names) {
        if (
          lockfileEntry(lockfiles.base, dir, name) !==
          lockfileEntry(lockfiles.head, dir, name)
        ) {
          return `the version of ${name} in ${dir} changed`;
        }
      }
    }
  }
  return null;
};

const changedFiles = (base, head) => {
  const output = tryGit('diff', '--name-only', '--no-renames', base, head);
  return output === null ? null : output.split('\n').filter(Boolean);
};

const writeOutput = (selected, lines) => {
  for (const line of lines) console.log(line);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `packages=${JSON.stringify(selected)}\n`
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Live API checks\n\n${lines.map((line) => `- ${line}`).join('\n')}\n`
    );
  }
};

const packages = readPackages();
const lives = [...packages.values()]
  .filter((json) => json.scripts?.['test:live'])
  .sort((a, b) => a.name.localeCompare(b.name));

const requested = (process.env.LIVE_PACKAGES ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)
  .map((name) => (name.startsWith('@') ? name : `@giveaway/${name}`));

if (process.env.LIVE_RUN_ALL === 'true') {
  const unknown = requested.filter(
    (name) => !lives.some((live) => live.name === name)
  );
  if (unknown.length > 0) {
    console.error(
      `No live checks in ${unknown.join(', ')}. The packages with live checks: ${lives.map((live) => live.name).join(', ')}`
    );
    process.exit(1);
  }
  const selected =
    requested.length > 0 ? requested : lives.map((live) => live.name);
  writeOutput(
    selected,
    selected.map((name) => `${name}: run by hand`)
  );
  process.exit(0);
}

const base = process.env.LIVE_BASE;
const head = process.env.LIVE_HEAD;
let changed = base && head ? changedFiles(base, head) : null;
let range = `${base}..${head}`;
if (changed === null) {
  const fallbackBase = process.env.LIVE_FALLBACK_BASE;
  changed = fallbackBase && head ? changedFiles(fallbackBase, head) : null;
  range = `${fallbackBase}..${head}`;
}
if (changed === null) {
  writeOutput(
    lives.map((live) => live.name),
    ['git cannot list the changed files, so every live check runs']
  );
  process.exit(0);
}

const [baseRange, headRange] = range.split('..');
const lockfiles = changed.includes(LOCKFILE)
  ? {
      base: tryGit('show', `${baseRange}:${LOCKFILE}`),
      head: tryGit('show', `${headRange}:${LOCKFILE}`)
    }
  : {};

const selected = [];
const lines = [`Changed files: ${changed.length} (${range})`];
for (const live of lives) {
  const reason = reasonFor(traceLiveCheck(packages, live), changed, lockfiles);
  if (reason) selected.push(live.name);
  lines.push(`${live.name}: ${reason ? `runs, ${reason}` : 'skips'}`);
}
writeOutput(selected, lines);
