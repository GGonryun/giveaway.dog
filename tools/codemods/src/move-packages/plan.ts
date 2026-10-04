import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { applyEdits, parseModule } from './specifiers.ts';
import type { Edit } from './specifiers.ts';
import {
  APP_ROOT,
  CODE_EXTENSIONS,
  isCode,
  isTest,
  readJson,
  toLogical
} from './workspace.ts';
import type { PackageEntry, Workspace } from './workspace.ts';

const posix = path.posix;

export const DB_CLIENT = '@giveaway/db-client';
export const DB_MODEL = '@giveaway/db-model';
export const SUPPRESSIONS = 'eslint-suppressions.json';

const PEER_DEPENDENCIES = new Set([
  'next',
  'next-auth',
  'react',
  'react-dom',
  'vitest'
]);

const BASE_DEV_DEPENDENCIES = [
  '@giveaway/eslint-config',
  '@giveaway/testing-server',
  '@giveaway/tsconfig',
  '@giveaway/vitest-config',
  '@types/node',
  'typescript',
  'vitest'
];

const DOM_DEV_DEPENDENCIES = ['@giveaway/testing-dom'];

const VISUAL_DEV_DEPENDENCIES = ['@giveaway/testing-visual'];

const SERVER_ONLY = 'server-only';

const BUILTINS = new Set(builtinModules);

export type FileKind = 'source' | 'data' | 'test' | 'fixture' | 'snapshot';

export type FileMove = {
  from: string;
  to: string;
  pkg: string;
  kind: FileKind;
};

export type TestProject = 'server' | 'frontend' | 'snapshot';

export type Suppressions = Record<string, Record<string, { count: number }>>;

export type PackagePlan = {
  entry: PackageEntry;
  moves: FileMove[];
  exports: Record<string, string>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  testProjects: TestProject[];
  visual: boolean;
  react: boolean;
  suppressions: Suppressions;
};

export type Plan = {
  packages: PackagePlan[];
  moves: FileMove[];
  contents: Map<string, string>;
  importers: Map<string, { dependencies: Set<string>; dev: Set<string> }>;
  suppressions: Suppressions | null;
  rewrites: number;
  warnings: string[];
};

export type PlanOptions = {
  packages: string[];
  renames?: Record<string, string>;
};

export class MoveError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(problems.join('\n'));
    this.name = 'MoveError';
    this.problems = problems;
  }
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const sortKeys = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => compare(a, b))
  ) as Record<string, T>;

const stripCodeExtension = (file: string) => {
  const ext = posix.extname(file);
  return CODE_EXTENSIONS.includes(ext) ? file.slice(0, -ext.length) : file;
};

export const moduleId = (target: string) => {
  const id = stripCodeExtension(target);
  if (id === 'index') return '';
  return id.endsWith('/index') ? id.slice(0, -'/index'.length) : id;
};

export const exportKey = (target: string) => {
  const id = moduleId(target);
  return id ? `./${id}` : '.';
};

export const packageNameOf = (specifier: string) => {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('@/')
  ) {
    return null;
  }
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0];
  if (specifier.startsWith('node:') || BUILTINS.has(name)) return null;
  return name;
};

const typesPackageOf = (name: string) =>
  `@types/${name.startsWith('@') ? name.slice(1).replace('/', '__') : name}`;

const defaultName = (source: string) => {
  const base = posix.basename(source);
  const ext = posix.extname(base);
  if (base === `index${ext}`) {
    return posix.basename(posix.dirname(source)) + ext;
  }
  return base;
};

const sourceFor = (entry: PackageEntry, logical: string) =>
  [...entry.sources]
    .sort((a, b) => b.length - a.length)
    .find((source) =>
      source.endsWith('/') ? logical.startsWith(source) : logical === source
    ) ?? null;

const SNAPSHOT = /^(.*\/__tests__\/)__snapshots__\/(.+)\.snap$/;
const SCREENSHOT = /^(.*\/__tests__\/)__screenshots__\/([^/]+)\/(.+)$/;

const testOfAttachment = (logical: string) => {
  const snapshot = logical.match(SNAPSHOT);
  if (snapshot) return snapshot[1] + snapshot[2];
  const screenshot = logical.match(SCREENSHOT);
  return screenshot ? screenshot[1] + screenshot[2] : null;
};

const kindOf = (ws: Workspace, logical: string): FileKind => {
  if (ws.map.testFixtures[logical]) return 'fixture';
  if (testOfAttachment(logical)) return 'snapshot';
  if (!isCode(logical)) return 'data';
  return isTest(logical) ? 'test' : 'source';
};

const ownerOfFile = (ws: Workspace, logical: string) => {
  const test = testOfAttachment(logical);
  if (test) return ws.ownerOf(test);
  return isCode(logical) ? ws.ownerOf(logical) : ws.ownerOfData(logical);
};

type Placement = {
  targets: Map<string, string>;
  problems: string[];
};

const placeFiles = (
  ws: Workspace,
  entry: PackageEntry,
  files: string[],
  renames: Record<string, string>,
  usedRenames: Set<string>
): Placement => {
  const problems: string[] = [];
  const targets = new Map<string, string>();
  const single = entry.sources.length === 1 && entry.sources[0].endsWith('/');
  const rename = (key: string) => {
    if (!(key in renames)) return null;
    usedRenames.add(key);
    return renames[key];
  };
  const renameFile = (key: string) => {
    const renamed = rename(key);
    if (renamed === null || posix.extname(renamed)) return renamed;
    return renamed + posix.extname(key);
  };

  const placeSource = (logical: string, source: string) => {
    if (!source.endsWith('/')) return renameFile(source) ?? defaultName(source);
    const renamed = rename(source);
    const prefix =
      renamed !== null
        ? renamed.replace(/\/?$/, '/').replace(/^\/$/, '')
        : single
          ? ''
          : posix.basename(source) + '/';
    return prefix + logical.slice(source.length);
  };

  for (const logical of files) {
    const kind = kindOf(ws, logical);
    if (kind === 'fixture') {
      targets.set(
        logical,
        renameFile(logical) ?? `testing/${posix.basename(logical)}`
      );
      continue;
    }
    if (kind === 'snapshot') continue;
    const source = sourceFor(entry, logical);
    if (source) targets.set(logical, placeSource(logical, source));
  }

  const sourceFiles = files.filter(
    (logical) => targets.has(logical) && kindOf(ws, logical) === 'source'
  );
  for (const logical of files) {
    if (targets.has(logical) || kindOf(ws, logical) !== 'test') continue;
    const marker = logical.lastIndexOf('/__tests__/');
    if (marker < 0) {
      problems.push(`${entry.name}: cannot place test ${logical}`);
      continue;
    }
    const dir = logical.slice(0, marker);
    const rest = logical.slice(marker + '/__tests__/'.length);
    const base =
      dir + '/' + rest.replace(/\.(snapshot\.)?(test|spec)\.tsx?$/, '');
    const subject =
      ['.ts', '.tsx', '/index.ts', '/index.tsx']
        .map((ext) => base + ext)
        .find((candidate) => sourceFiles.includes(candidate)) ??
      sourceFiles.find((file) => posix.dirname(file) === dir);
    if (!subject) {
      problems.push(
        `${entry.name}: cannot find the module that ${logical} tests`
      );
      continue;
    }
    const subjectTarget = targets.get(subject) as string;
    const oldStem = stripCodeExtension(posix.basename(subject));
    const newStem = stripCodeExtension(posix.basename(subjectTarget));
    const renamedRest =
      oldStem !== newStem && rest.startsWith(oldStem + '.')
        ? newStem + rest.slice(oldStem.length)
        : rest;
    targets.set(
      logical,
      posix.join(posix.dirname(subjectTarget), '__tests__', renamedRest)
    );
  }

  for (const logical of files) {
    if (kindOf(ws, logical) !== 'snapshot') continue;
    const test = testOfAttachment(logical) as string;
    const testTarget = targets.get(test);
    if (!testTarget) {
      problems.push(
        `${entry.name}: ${logical} belongs to a test that does not move`
      );
      continue;
    }
    const snapshot = logical.match(SNAPSHOT);
    const screenshot = logical.match(SCREENSHOT);
    const dir = posix.dirname(testTarget);
    const name = posix.basename(testTarget);
    targets.set(
      logical,
      snapshot
        ? `${dir}/__snapshots__/${name}.snap`
        : `${dir}/__screenshots__/${name}/${screenshot?.[3]}`
    );
  }
  return { targets, problems };
};

const collectFiles = (ws: Workspace, names: Set<string>) => {
  const byPackage = new Map<string, string[]>();
  for (const name of names) byPackage.set(name, []);
  for (const file of ws.files) {
    const logical = toLogical(file);
    if (logical === null) continue;
    const owner = ownerOfFile(ws, logical);
    if (owner && names.has(owner)) byPackage.get(owner)?.push(logical);
  }
  return byPackage;
};

export const planMove = (ws: Workspace, options: PlanOptions): Plan => {
  const problems: string[] = [];
  const renames = options.renames ?? {};
  const usedRenames = new Set<string>();
  const names = new Set(options.packages);
  const entries = new Map<string, PackageEntry>();

  for (const name of names) {
    const entry = ws.map.packages.find((pkg) => pkg.name === name);
    if (!entry) {
      problems.push(`${name} is not in the package map`);
    } else if (!entry.path.startsWith('packages/')) {
      problems.push(`${name} is not a package under packages/`);
    } else if (fs.existsSync(path.join(ws.root, entry.path, 'package.json'))) {
      problems.push(`${name} is already in ${entry.path}`);
    } else {
      entries.set(name, entry);
    }
  }
  if (problems.length) throw new MoveError(problems);

  const filesByPackage = collectFiles(ws, names);
  const moves: FileMove[] = [];
  const warnings: string[] = [];
  for (const [name, entry] of entries) {
    const files = filesByPackage.get(name) ?? [];
    for (const source of entry.sources) {
      const found = files.some((file) =>
        source.endsWith('/') ? file.startsWith(source) : file === source
      );
      if (!found) warnings.push(`${name}: source ${source} has no files`);
    }
    const placement = placeFiles(ws, entry, files, renames, usedRenames);
    problems.push(...placement.problems);
    for (const [logical, target] of placement.targets) {
      moves.push({
        from: `${APP_ROOT}/${logical}`,
        to: `${entry.path}/src/${target}`,
        pkg: name,
        kind: kindOf(ws, logical)
      });
    }
  }
  for (const key of Object.keys(renames)) {
    if (!usedRenames.has(key)) {
      problems.push(`--rename ${key}: no source or fixture of these packages`);
    }
  }

  const byTarget = new Map<string, FileMove[]>();
  const byModule = new Map<string, FileMove[]>();
  for (const move of moves) {
    byTarget.set(move.to, [...(byTarget.get(move.to) ?? []), move]);
    if (move.kind === 'source' || move.kind === 'fixture') {
      const key = `${move.pkg}${exportKey(srcPath(entries, move)).slice(1)}`;
      byModule.set(key, [...(byModule.get(key) ?? []), move]);
    }
  }
  for (const [target, clashing] of byTarget) {
    if (clashing.length > 1) {
      problems.push(
        `${target} is the target of ${clashing.map((move) => move.from).join(' and ')}`
      );
    }
  }
  for (const [id, clashing] of byModule) {
    if (clashing.length > 1) {
      problems.push(
        `${id} is the module name of ${clashing
          .map((move) => move.from)
          .join(' and ')}. Rename one with --rename <source>=<name>`
      );
    }
  }
  if (problems.length) throw new MoveError(problems.sort());

  return { ...rewrite(ws, entries, moves), warnings };
};

const srcPath = (entries: Map<string, PackageEntry>, move: FileMove) =>
  posix.relative(`${entries.get(move.pkg)?.path}/src`, move.to);

const STEM_PATTERN = /['"`]\.{1,2}\/?['"`]/;

const rewrite = (
  ws: Workspace,
  entries: Map<string, PackageEntry>,
  moves: FileMove[]
): Omit<Plan, 'warnings'> => {
  const problems: string[] = [];
  const fileSet = new Set(ws.files);
  const moveOf = new Map(moves.map((move) => [move.from, move]));
  const stems = [
    ...new Set(
      moves.map((move) => {
        const stem = stripCodeExtension(posix.basename(move.from));
        return stem === 'index'
          ? posix.basename(posix.dirname(move.from))
          : stem;
      })
    )
  ];
  const projectRoots = new Set(
    ws.files
      .filter((file) => posix.basename(file) === 'package.json')
      .map((file) => posix.dirname(file))
  );
  const projectOf = (file: string) => {
    for (let dir = posix.dirname(file); dir !== '.'; dir = posix.dirname(dir)) {
      if (projectRoots.has(dir)) return dir;
    }
    return null;
  };

  const resolveFile = (base: string) => {
    const trimmed = base.replace(/\/+$/, '');
    const candidates = [
      trimmed,
      ...CODE_EXTENSIONS.map((ext) => trimmed + ext),
      ...CODE_EXTENSIONS.map((ext) => `${trimmed}/index${ext}`)
    ];
    return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
  };
  const resolve = (from: string, specifier: string) => {
    if (specifier.startsWith('@/')) {
      const alias = ws.aliases.find(([prefix]) => specifier.startsWith(prefix));
      return alias
        ? resolveFile(alias[1] + specifier.slice(alias[0].length))
        : null;
    }
    if (specifier.startsWith('.')) {
      return resolveFile(
        posix.normalize(posix.join(posix.dirname(from), specifier))
      );
    }
    return null;
  };

  const relativeSpecifier = (from: string, to: string, original: string) => {
    let relative = posix.relative(posix.dirname(from), to);
    const ext = posix.extname(to);
    if (CODE_EXTENSIONS.includes(ext) && !original.endsWith(ext)) {
      relative = relative.slice(0, -ext.length);
      const explicitIndex = original === 'index' || original.endsWith('/index');
      if (posix.basename(relative) === 'index' && !explicitIndex) {
        relative = posix.dirname(relative);
      }
    }
    if (relative === '') return '.';
    return relative.startsWith('.') ? relative : `./${relative}`;
  };

  const packageSpecifier = (move: FileMove) => {
    const id = moduleId(srcPath(entries, move));
    return id ? `${move.pkg}/${id}` : move.pkg;
  };

  const rewriteSpecifier = (
    file: string,
    target: string,
    pkg: string | null,
    value: string
  ) => {
    if (value === '@prisma/client' && pkg && pkg !== DB_CLIENT) return DB_MODEL;
    const resolved = resolve(file, value);
    if (!resolved) {
      if (pkg && value.startsWith('@/')) {
        problems.push(
          `${pkg}: ${file} imports ${value}, which does not resolve`
        );
      }
      return value;
    }
    const targetMove = moveOf.get(resolved);
    if (targetMove) {
      if (targetMove.pkg === pkg) {
        return relativeSpecifier(target, targetMove.to, value);
      }
      if (
        targetMove.kind !== 'source' &&
        targetMove.kind !== 'data' &&
        targetMove.kind !== 'fixture'
      ) {
        problems.push(
          `${file} imports ${resolved}, a test file of ${targetMove.pkg}`
        );
        return value;
      }
      return packageSpecifier(targetMove);
    }
    if (!pkg) return value;
    if (resolved.startsWith(APP_ROOT + '/')) {
      problems.push(
        `${pkg}: ${file} imports ${resolved}, which stays in ${APP_ROOT}`
      );
      return value;
    }
    return value.startsWith('.')
      ? relativeSpecifier(target, resolved, value)
      : value;
  };

  type Usage = { pkg: string; kind: FileKind; name: string; mockOnly: boolean };
  const usages: Usage[] = [];
  const contents = new Map<string, string>();
  const importers = new Map<
    string,
    { dependencies: Set<string>; dev: Set<string> }
  >();
  const serverOnly = new Set<string>();
  let rewrites = 0;

  for (const file of ws.files) {
    if (!isCode(file)) continue;
    const move = moveOf.get(file);
    const text = fs.readFileSync(path.join(ws.root, file), 'utf8');
    if (
      !move &&
      !STEM_PATTERN.test(text) &&
      !stems.some((stem) => text.includes(stem))
    ) {
      continue;
    }
    const parsed = parseModule(file, text);
    const target = move?.to ?? file;
    const pkg = move?.pkg ?? null;
    const edits: Edit[] = [];

    for (const specifier of parsed.specifiers) {
      const value = rewriteSpecifier(file, target, pkg, specifier.value);
      if (value !== specifier.value) {
        edits.push({ start: specifier.start, end: specifier.end, text: value });
      }
      const name = packageNameOf(value);
      if (!name) continue;
      if (pkg && move) {
        usages.push({
          pkg,
          kind: move.kind,
          name,
          mockOnly: specifier.mockOnly
        });
      } else if (entries.has(name) && !file.startsWith(APP_ROOT + '/')) {
        const project = projectOf(file);
        if (!project) continue;
        const record = importers.get(project) ?? {
          dependencies: new Set<string>(),
          dev: new Set<string>()
        };
        const dev = isTest(file) || specifier.mockOnly;
        record[dev ? 'dev' : 'dependencies'].add(name);
        importers.set(project, record);
      }
    }

    const entry = pkg ? entries.get(pkg) : undefined;
    if (
      entry?.type === 'server' &&
      move?.kind === 'source' &&
      /\.tsx?$/.test(file) &&
      !file.endsWith('.d.ts') &&
      !parsed.directives.some(
        (directive) => directive.value === 'use server'
      ) &&
      !parsed.specifiers.some((specifier) => specifier.value === SERVER_ONLY)
    ) {
      const last = parsed.directives.at(-1);
      edits.push(
        last
          ? {
              start: last.end,
              end: last.end,
              text: `\n\nimport '${SERVER_ONLY}';`
            }
          : { start: 0, end: 0, text: `import '${SERVER_ONLY}';\n\n` }
      );
      serverOnly.add(pkg as string);
    }

    if (edits.length) {
      rewrites += edits.length;
      contents.set(target, applyEdits(text, edits));
    }
  }
  if (problems.length) throw new MoveError([...new Set(problems)].sort());

  const suppressionsFile = path.join(ws.root, SUPPRESSIONS);
  const rootSuppressions = fs.existsSync(suppressionsFile)
    ? readJson<Suppressions>(ws.root, SUPPRESSIONS)
    : null;

  const packages = [...entries.values()].map((entry) =>
    planPackage(
      ws,
      entry,
      moves.filter((move) => move.pkg === entry.name),
      {
        usages: usages.filter((usage) => usage.pkg === entry.name),
        serverOnly: serverOnly.has(entry.name),
        rootSuppressions,
        problems
      }
    )
  );
  if (problems.length) throw new MoveError([...new Set(problems)].sort());

  return {
    packages,
    moves,
    contents,
    importers,
    suppressions: rootSuppressions,
    rewrites
  };
};

type PackageInputs = {
  usages: { kind: FileKind; name: string; mockOnly: boolean }[];
  serverOnly: boolean;
  rootSuppressions: Suppressions | null;
  problems: string[];
};

const planPackage = (
  ws: Workspace,
  entry: PackageEntry,
  moves: FileMove[],
  inputs: PackageInputs
): PackagePlan => {
  const src = `${entry.path}/src/`;
  const exportsMap: Record<string, string> = {};
  for (const move of moves) {
    const relative = move.to.slice(src.length);
    const exported =
      move.kind === 'fixture' ||
      (move.kind === 'source' && !move.to.endsWith('.d.ts')) ||
      (move.kind === 'data' && move.to.endsWith('.json'));
    if (exported) exportsMap[exportKey(relative)] = `./src/${relative}`;
  }
  const exports = Object.fromEntries(
    Object.entries(exportsMap).sort(([a], [b]) =>
      a === '.' ? -1 : b === '.' ? 1 : compare(a, b)
    )
  );

  const tests = moves
    .filter((move) => move.kind === 'test')
    .map((move) => move.to);
  const testProjects: TestProject[] = [];
  if (tests.some((file) => file.endsWith('.test.ts')))
    testProjects.push('server');
  if (tests.some((file) => /(?<!\.snapshot|\.visual)\.test\.tsx$/.test(file))) {
    testProjects.push('frontend');
  }
  if (tests.some((file) => file.endsWith('.snapshot.test.tsx'))) {
    testProjects.push('snapshot');
  }
  const visual = tests.some((file) => file.endsWith('.visual.test.tsx'));
  const react = moves.some((move) => move.to.endsWith('.tsx'));

  const dependencies = new Set<string>();
  const peers = new Set<string>();
  const dev = new Set<string>(BASE_DEV_DEPENDENCIES);
  if (testProjects.includes('frontend') || testProjects.includes('snapshot')) {
    DOM_DEV_DEPENDENCIES.forEach((name) => dev.add(name));
  }
  if (visual) VISUAL_DEV_DEPENDENCIES.forEach((name) => dev.add(name));
  if (inputs.serverOnly) dependencies.add(SERVER_ONLY);
  for (const usage of inputs.usages) {
    if (usage.name === entry.name) continue;
    const production = usage.kind === 'source' && !usage.mockOnly;
    if (!production) dev.add(usage.name);
    else if (PEER_DEPENDENCIES.has(usage.name)) peers.add(usage.name);
    else dependencies.add(usage.name);
  }
  for (const name of [...dependencies, ...peers, ...dev]) {
    const types = typesPackageOf(name);
    if (ws.catalog.has(types)) dev.add(types);
  }
  for (const name of [...dependencies, ...peers]) dev.delete(name);

  const version = (name: string) => {
    if (name.startsWith('@giveaway/')) return 'workspace:*';
    if (!ws.catalog.has(name)) {
      inputs.problems.push(
        `${entry.name}: ${name} is not in the pnpm catalog. Add it with pnpm add --save-catalog`
      );
    }
    return 'catalog:';
  };
  const versions = (names: Set<string>) =>
    sortKeys(
      Object.fromEntries([...names].map((name) => [name, version(name)]))
    );

  const suppressions: Suppressions = {};
  for (const move of moves) {
    const entries = inputs.rootSuppressions?.[move.from];
    if (entries) suppressions[move.to] = entries;
  }

  return {
    entry,
    moves,
    exports,
    dependencies: versions(dependencies),
    peerDependencies: versions(peers),
    devDependencies: versions(dev),
    testProjects,
    visual,
    react,
    suppressions: sortKeys(suppressions)
  };
};
