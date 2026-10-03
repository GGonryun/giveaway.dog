import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const map = JSON.parse(
  fs.readFileSync(path.join(here, 'package-map.json'), 'utf8')
);
const verbose = process.argv.includes('--verbose');

const SOURCE_ROOTS = [
  'app',
  'components',
  'lib',
  'procedures',
  'schemas',
  'types',
  'test',
  '__tests__',
  'e2e',
  'prisma',
  'packages',
  'apps',
  'tools'
];
const ROOT_FILES = [
  'middleware.ts',
  'next.config.ts',
  'vitest.config.ts',
  'playwright.config.ts'
];
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'migrations', 'coverage']);
const ROUTE_FILE =
  /^app\/(.*\/)?(page|layout|loading|error|not-found|route|default|template|opengraph-image|twitter-image|icon|global-error)\.tsx?$/;

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), {
    withFileTypes: true
  })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(rel);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(rel);
    }
  }
};
const appRoot = fs.existsSync(path.join(root, 'apps/web/app'))
  ? 'apps/web/'
  : '';

SOURCE_ROOTS.filter((dir) => fs.existsSync(path.join(root, dir))).forEach(walk);
if (!appRoot) {
  ROOT_FILES.filter((file) => fs.existsSync(path.join(root, file))).forEach(
    (file) => files.push(file)
  );
}
const realPath = new Map();
for (let index = 0; index < files.length; index++) {
  const real = files[index];
  const logical =
    appRoot && real.startsWith(appRoot) ? real.slice(appRoot.length) : real;
  realPath.set(logical, real);
  files[index] = logical;
}
const fileSet = new Set(files);

const tsconfig = JSON.parse(
  fs.readFileSync(path.join(root, appRoot, 'tsconfig.json'), 'utf8')
);
const aliases = Object.entries(tsconfig.compilerOptions?.paths ?? {}).map(
  ([key, [target]]) => [key.replace(/\*$/, ''), target.replace(/\*$/, '')]
);

const packages = map.packages;
const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
const sourceOwners = packages
  .flatMap((pkg) => pkg.sources.map((source) => [source, pkg.name]))
  .sort((a, b) => b[0].length - a[0].length);
const pathOwners = packages
  .map((pkg) => [pkg.path + '/', pkg.name])
  .sort((a, b) => b[0].length - a[0].length);
const dead = new Set(map.deadFiles);

const DEAD = Symbol('dead');
const isTest = (file) =>
  /(^|\/)__tests__\/|\.(test|spec)\.|^test\/|^e2e\//.test(file);

const ownerOfSource = (file) => {
  const byPath = pathOwners.find(([prefix]) => file.startsWith(prefix));
  if (byPath) return byPath[1];
  if (ROUTE_FILE.test(file)) return 'apps/web';
  const match = sourceOwners.find(([source]) =>
    source.endsWith('/') ? file.startsWith(source) : file === source
  );
  return match?.[1] ?? null;
};

const ownerOf = (file) => {
  if (map.testFixtures[file]) return map.testFixtures[file].package;
  const direct = ownerOfSource(file);
  if (direct || !isTest(file)) return direct;
  const base = file
    .replace('/__tests__/', '/')
    .replace(/\.(snapshot\.|visual\.)?(test|spec)\.tsx?$/, '');
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (dead.has(base + ext)) return DEAD;
    if (fileSet.has(base + ext)) return ownerOfSource(base + ext);
  }
  const dir = file.split('/__tests__/')[0];
  const siblings = files.filter(
    (other) =>
      !isTest(other) &&
      path.posix.dirname(other) === dir &&
      ownerOfSource(other)
  );
  return siblings.length ? ownerOfSource(siblings[0]) : null;
};

const resolveFile = (base) => {
  const candidates = [
    base,
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => base + '/index' + ext)
  ];
  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
};

const resolve = (from, specifier) => {
  if (specifier.startsWith('@giveaway/')) {
    const name = specifier.split('/').slice(0, 2).join('/');
    return byName.has(name) ? { pkg: name } : null;
  }
  for (const [prefix, target] of aliases) {
    if (specifier.startsWith(prefix)) {
      return { file: resolveFile(target + specifier.slice(prefix.length)) };
    }
  }
  if (specifier.startsWith('.')) {
    return {
      file: resolveFile(
        path.posix.normalize(
          path.posix.join(path.posix.dirname(from), specifier)
        )
      )
    };
  }
  return null;
};

const IMPORT_PATTERNS = [
  /(?:^|[\n;])\s*(?:import|export)\s+(?:type\s+)?[^'";]*?\s*from\s*['"]([^'"]+)['"]/g,
  /(?:^|[\n;])\s*import\s*['"]([^'"]+)['"]/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\(\s*['"]([^'"]+)['"]\s*\)/g
];

const knownRefactor = (from, to) =>
  map.refactors.find(
    (refactor) =>
      new RegExp(refactor.from).test(from) && new RegExp(refactor.to).test(to)
  );

const texts = new Map();
const readSource = (file) => {
  if (!texts.has(file)) {
    texts.set(
      file,
      fs.readFileSync(path.join(root, realPath.get(file)), 'utf8')
    );
  }
  return texts.get(file);
};

const sourceEdges = new Map();
const testEdges = new Map();
const knownEdges = new Map();
const unmapped = [];
const addEdge = (edges, a, b, evidence) => {
  const key = a + ' -> ' + b;
  if (!edges.has(key)) edges.set(key, []);
  edges.get(key).push(evidence);
};

for (const file of files) {
  const owner = ownerOf(file);
  if (owner === DEAD) continue;
  if (!owner) {
    if (!dead.has(file)) unmapped.push(file);
    continue;
  }
  const text = readSource(file);
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const target = resolve(file, match[1]);
      if (!target) continue;
      const targetOwner = target.pkg ?? (target.file && ownerOf(target.file));
      if (!targetOwner || targetOwner === DEAD || targetOwner === owner) {
        continue;
      }
      const evidence = file + ' => ' + (target.file ?? target.pkg);
      const refactor = target.file && knownRefactor(file, target.file);
      if (refactor) {
        addEdge(knownEdges, refactor.id, '', evidence);
      } else {
        addEdge(
          isTest(file) ? testEdges : sourceEdges,
          owner,
          targetOwner,
          evidence
        );
      }
    }
  }
}

const findCycles = (edgeMaps) => {
  const adjacency = new Map();
  for (const edges of edgeMaps) {
    for (const key of edges.keys()) {
      const [a, b] = key.split(' -> ');
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a).add(b);
    }
  }
  let counter = 0;
  const index = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const cycles = [];
  const connect = (node) => {
    index.set(node, counter);
    low.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);
    for (const next of adjacency.get(node)) {
      if (!index.has(next)) {
        connect(next);
        low.set(node, Math.min(low.get(node), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node), index.get(next)));
      }
    }
    if (low.get(node) === index.get(node)) {
      const component = [];
      let member;
      do {
        member = stack.pop();
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      if (component.length > 1) cycles.push(component.sort());
    }
  };
  for (const node of adjacency.keys()) if (!index.has(node)) connect(node);
  return cycles;
};

const typeOf = (name) => byName.get(name)?.type;
const violations = [...sourceEdges.entries()].filter(([key]) => {
  const [a, b] = key.split(' -> ');
  const allowed = map.dependencyRules[typeOf(a)];
  return allowed && typeOf(b) && !allowed.includes(typeOf(b));
});
const undeclared = [...sourceEdges.keys()].filter((key) => {
  const [a, b] = key.split(' -> ');
  return byName.has(a) && !byName.get(a).dependsOn.includes(b);
});
const sourceCycles = findCycles([sourceEdges]);
const testCycles = findCycles([sourceEdges, testEdges]).filter(
  (cycle) =>
    !sourceCycles.some((sourceCycle) =>
      cycle.every((member) => sourceCycle.includes(member))
    )
);
const DIRECTIVE_PREFIX = String.raw`^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*`;
const hasDirective = (text, directive) =>
  new RegExp(`${DIRECTIVE_PREFIX}['"]${directive}['"]`).test(text);
const VALUE_IMPORT_PATTERNS = [
  /(?:^|[\n;])\s*(import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g,
  /(?:^|[\n;])\s*import\s*()()()['"]([^'"]+)['"]/g,
  /import\(\s*()()()['"]([^'"]+)['"]\s*\)/g,
  /require\(\s*()()()['"]([^'"]+)['"]\s*\)/g
];
const isTypeOnly = (typeKeyword, clause) => {
  if (typeKeyword) return true;
  const named = clause.trim().match(/^\{([\s\S]*)\}$/);
  if (!named) return false;
  const specifiers = named[1]
    .split(',')
    .map((specifier) => specifier.trim())
    .filter(Boolean);
  return (
    specifiers.length > 0 &&
    specifiers.every((specifier) => /^type\s/.test(specifier))
  );
};
const runtimeOf = (name) =>
  byName
    .get(name)
    ?.tags.find((tag) => tag.startsWith('runtime:'))
    ?.slice('runtime:'.length);

const clientRoots = files.filter(
  (file) =>
    !isTest(file) &&
    ownerOf(file) &&
    ownerOf(file) !== DEAD &&
    hasDirective(readSource(file), 'use client')
);
const reachedFrom = new Map(clientRoots.map((file) => [file, null]));
const serverReached = clientRoots.filter(
  (file) => runtimeOf(ownerOf(file)) === 'server'
);
const queue = [...clientRoots];
while (queue.length) {
  const file = queue.shift();
  const text = readSource(file);
  for (const pattern of VALUE_IMPORT_PATTERNS) {
    for (const [, , typeKeyword, clause, specifier] of text.matchAll(pattern)) {
      if (isTypeOnly(typeKeyword, clause)) continue;
      const target = resolve(file, specifier);
      const next = target?.file ?? target?.pkg;
      if (!next || reachedFrom.has(next)) continue;
      const owner = target.pkg ?? ownerOf(target.file);
      if (!owner || owner === DEAD || isTest(next)) continue;
      reachedFrom.set(next, file);
      if (target.file && hasDirective(readSource(next), 'use server')) continue;
      if (runtimeOf(owner) === 'server') {
        serverReached.push(next);
      } else if (target.file) {
        queue.push(next);
      }
    }
  }
}
const chainTo = (module) => {
  const chain = [];
  for (let step = module; step; step = reachedFrom.get(step)) {
    chain.unshift(step);
  }
  return chain;
};

const deadPresent = [...dead].filter((file) => fileSet.has(file));

const show = (label, items, format = (item) => item) => {
  console.log(`${label}: ${items.length}`);
  if (verbose || items.length <= 10) {
    items.forEach((item) => console.log('  ' + format(item)));
  }
};
const withEvidence = ([key, evidence]) =>
  `${key}  (${evidence.length} import${evidence.length === 1 ? '' : 's'}, e.g. ${evidence[0]})`;

console.log(
  `Checked ${files.length} files against ${packages.length} packages`
);
show('Unmapped files', unmapped);
show('Cycles in source code', sourceCycles, (cycle) => cycle.join(', '));
show('Boundary violations', violations, withEvidence);
show(
  'Imports that a listed refactor removes',
  [...knownEdges],
  ([id, evidence]) =>
    `${id.replace(' -> ', '')}: ${evidence.length} import(s), e.g. ${evidence[0]}`
);
show(
  'Server modules that client code imports',
  serverReached.sort(),
  (module) => `${module}  (${chainTo(module).join(' -> ')})`
);
show('Dependencies missing from package-map.json', undeclared);
show('Cycles that only tests create', testCycles, (cycle) => cycle.join(', '));
show('Dead files still present', deadPresent);

process.exitCode =
  unmapped.length ||
  sourceCycles.length ||
  violations.length ||
  serverReached.length
    ? 1
    : 0;
