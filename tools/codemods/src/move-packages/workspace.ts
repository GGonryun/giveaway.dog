import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const APP_ROOT = 'apps/web';
export const PACKAGE_MAP = 'docs/monorepo/package-map.json';

export const CODE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];

const SKIP_SEGMENTS = new Set(['node_modules', '.next', 'coverage']);

const ROUTE_FILE =
  /^app\/(.*\/)?(page|layout|loading|error|not-found|route|default|template|opengraph-image|twitter-image|icon|global-error)\.tsx?$/;

export type PackageEntry = {
  name: string;
  path: string;
  type: string;
  tags: string[];
  layer: number;
  sources: string[];
  dependsOn: string[];
  npm: string[];
  note?: string;
};

export type TestFixture = { package: string; split: boolean };

export type PackageMap = {
  testFixtures: Record<string, TestFixture>;
  deadFiles: string[];
  packages: PackageEntry[];
};

export type Workspace = {
  root: string;
  map: PackageMap;
  files: string[];
  tracked: Set<string>;
  catalog: Set<string>;
  aliases: [string, string][];
  ownerOf: (logical: string) => string | null;
  ownerOfData: (logical: string) => string | null;
};

export const isCode = (file: string) =>
  CODE_EXTENSIONS.includes(path.posix.extname(file));

export const isTest = (file: string) =>
  /(^|\/)__tests__\/|(^|\/)src\/testing\/|\.(test|spec)\.|^test\/|^e2e\/|(^|\/)(vitest(\.visual)?|eslint)\.config\.[cm]?[jt]s$/.test(
    file
  );

export const toLogical = (file: string) =>
  file.startsWith(APP_ROOT + '/') ? file.slice(APP_ROOT.length + 1) : null;

export const readJson = <T>(root: string, file: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as T;

const git = (root: string, args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);

const listFiles = (root: string) => {
  const tracked = new Set(git(root, ['ls-files', '-z']));
  const others = git(root, [
    'ls-files',
    '-z',
    '--others',
    '--exclude-standard'
  ]);
  const files = [...tracked, ...others]
    .filter((file) => !file.split('/').some((part) => SKIP_SEGMENTS.has(part)))
    .filter((file) => fs.existsSync(path.join(root, file)))
    .sort();
  return { files: [...new Set(files)], tracked };
};

const readCatalog = (root: string) => {
  const text = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
  const catalog = new Set<string>();
  let inCatalog = false;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) {
      inCatalog = line.trim() === 'catalog:';
      continue;
    }
    const match = inCatalog && line.match(/^\s+'?([^':\s]+)'?\s*:/);
    if (match) catalog.add(match[1]);
  }
  return catalog;
};

const readAliases = (root: string): [string, string][] => {
  const tsconfig = readJson<{
    compilerOptions?: { paths?: Record<string, string[]> };
  }>(root, `${APP_ROOT}/tsconfig.json`);
  return Object.entries(tsconfig.compilerOptions?.paths ?? {}).map(
    ([key, [target]]) => [
      key.replace(/\*$/, ''),
      `${APP_ROOT}/${target.replace(/\*$/, '')}`
    ]
  );
};

export const loadWorkspace = (root: string): Workspace => {
  const map = readJson<PackageMap>(root, PACKAGE_MAP);
  const { files, tracked } = listFiles(root);
  const appCode = files
    .map(toLogical)
    .filter((file): file is string => file !== null && isCode(file));
  const appCodeSet = new Set(appCode);
  const dead = new Set(map.deadFiles);

  const sourceOwners = map.packages
    .flatMap((pkg) => pkg.sources.map((source) => [source, pkg.name]))
    .sort((a, b) => b[0].length - a[0].length);

  const ownerOfData = (file: string) =>
    sourceOwners.find(([source]) =>
      source.endsWith('/') ? file.startsWith(source) : file === source
    )?.[1] ?? null;

  const ownerOfSource = (file: string) => {
    if (ROUTE_FILE.test(file)) return APP_ROOT;
    return ownerOfData(file);
  };

  const ownerOf = (file: string): string | null => {
    if (map.testFixtures[file]) return map.testFixtures[file].package;
    const direct = ownerOfSource(file);
    if (direct || !isTest(file)) return direct;
    const base = file
      .replace('/__tests__/', '/')
      .replace(/\.(snapshot\.)?(test|spec)\.tsx?$/, '');
    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      if (dead.has(base + ext)) return null;
      if (appCodeSet.has(base + ext)) return ownerOfSource(base + ext);
    }
    const dir = file.split('/__tests__/')[0];
    const sibling = appCode.find(
      (other) =>
        !isTest(other) &&
        path.posix.dirname(other) === dir &&
        ownerOfSource(other)
    );
    return sibling ? ownerOfSource(sibling) : null;
  };

  return {
    root,
    map,
    files,
    tracked,
    catalog: readCatalog(root),
    aliases: readAliases(root),
    ownerOf,
    ownerOfData
  };
};
