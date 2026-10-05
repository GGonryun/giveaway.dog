import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];

const DIRECTIVE_PREFIX = String.raw`^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*`;

const VALUE_IMPORT_PATTERNS = [
  /(?:^|[\n;])\s*(import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g,
  /(?:^|[\n;])\s*import\s*()()()['"]([^'"]+)['"]/g,
  /import\(\s*()()()['"]([^'"]+)['"]\s*\)/g,
  /require\(\s*()()()['"]([^'"]+)['"]\s*\)/g
];

const TEST_FILE =
  /(^|\/)__tests__\/|(^|\/)src\/testing\/|\.(test|spec)\.[^/]+$|(^|\/)(vitest(\.visual)?|eslint)\.config\.[cm]?[jt]s$/;

const hasDirective = (text, directive) =>
  new RegExp(`${DIRECTIVE_PREFIX}['"]${directive}['"]`).test(text);

const isTypeOnlyClause = (typeKeyword, clause) => {
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

const cached = (compute) => {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) cache.set(key, compute(key));
    return cache.get(key);
  };
};

const cachedByFile = (compute) => {
  const cache = new Map();
  return (file) => {
    const stamp = fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs;
    const entry = cache.get(file);
    if (entry?.stamp === stamp) return entry.value;
    const value = compute(file);
    cache.set(file, { stamp, value });
    return value;
  };
};

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const readText = cachedByFile((file) => fs.readFileSync(file, 'utf8'));

const packageRootOf = cached((directory) => {
  if (fs.existsSync(path.join(directory, 'package.json'))) return directory;
  const parent = path.dirname(directory);
  return parent === directory ? null : packageRootOf(parent);
});

const readManifest = cachedByFile(readJson);

const manifestOf = (root) => readManifest(path.join(root, 'package.json'));

const ownerOf = (file) => {
  const root = packageRootOf(path.dirname(file));
  const manifest = root && manifestOf(root);
  return {
    name: manifest?.name ?? root,
    runtime: manifest?.nx?.tags
      ?.find((tag) => tag.startsWith('runtime:'))
      ?.slice('runtime:'.length)
  };
};

const readTsconfig = cachedByFile(readJson);

const pathAliasesOf = (root) =>
  Object.entries(
    readTsconfig(path.join(root, 'tsconfig.json'))?.compilerOptions?.paths ?? {}
  ).map(([key, [target]]) => [
    key.replace(/\*$/, ''),
    path.join(root, target.replace(/\*$/, ''))
  ]);

const resolveFile = (base) =>
  [
    base,
    ...EXTENSIONS.map((extension) => base + extension),
    ...EXTENSIONS.map((extension) => path.join(base, 'index' + extension))
  ].find((candidate) =>
    fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()
  ) ?? null;

const findInstalledPackage = (directory, name) => {
  for (let current = directory; ; current = path.dirname(current)) {
    const candidate = path.join(current, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate);
    }
    if (path.dirname(current) === current) return null;
  }
};

const resolveImport = (from, specifier) => {
  const directory = path.dirname(from);
  if (specifier.startsWith('.')) {
    return resolveFile(path.resolve(directory, specifier));
  }
  if (specifier.startsWith('@giveaway/')) {
    const name = specifier.split('/').slice(0, 2).join('/');
    const root = findInstalledPackage(directory, name);
    if (!root) return null;
    const target =
      manifestOf(root)?.exports?.['.' + specifier.slice(name.length)];
    return typeof target === 'string'
      ? resolveFile(path.join(root, target))
      : null;
  }
  const root = packageRootOf(directory);
  for (const [prefix, target] of root ? pathAliasesOf(root) : []) {
    if (specifier.startsWith(prefix)) {
      return resolveFile(target + specifier.slice(prefix.length));
    }
  }
  return null;
};

const valueImportsOf = cachedByFile((file) => {
  const text = readText(file);
  const specifiers = [];
  for (const pattern of VALUE_IMPORT_PATTERNS) {
    for (const [, , typeKeyword, clause, specifier] of text.matchAll(pattern)) {
      if (!isTypeOnlyClause(typeKeyword, clause)) specifiers.push(specifier);
    }
  }
  return specifiers
    .map((specifier) => resolveImport(file, specifier))
    .filter(Boolean);
});

const findServerChain = (start) => {
  const reachedFrom = new Map([[start, null]]);
  const queue = [start];
  while (queue.length) {
    const file = queue.shift();
    if (TEST_FILE.test(file) || hasDirective(readText(file), 'use server')) {
      continue;
    }
    if (ownerOf(file).runtime === 'server') {
      const chain = [];
      for (let step = file; step; step = reachedFrom.get(step)) {
        chain.unshift(step);
      }
      return chain;
    }
    for (const next of valueImportsOf(file)) {
      if (!reachedFrom.has(next)) {
        reachedFrom.set(next, file);
        queue.push(next);
      }
    }
  }
  return null;
};

const isTypeOnlyNode = (node) =>
  node.importKind === 'type' ||
  node.exportKind === 'type' ||
  (node.type === 'ImportDeclaration' &&
    node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => specifier.importKind === 'type'));

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow a 'use client' module from reaching a module of a runtime:server package"
    },
    schema: [],
    messages: {
      serverPackage:
        "A 'use client' module cannot be in the runtime:server package {{package}}. Move it to a ui or feature package.",
      serverModule:
        "This 'use client' module reaches {{module}} of the runtime:server package {{package}}: {{chain}}. Move the shared code to a model package, use `import type`, or import a 'use server' module instead."
    }
  },
  create(context) {
    const { filename, sourceCode } = context;
    if (!hasDirective(sourceCode.text, 'use client')) return {};
    const relative = (file) => path.relative(context.cwd, file);

    const check = (node, source) => {
      if (!source || typeof source.value !== 'string' || isTypeOnlyNode(node)) {
        return;
      }
      const target = resolveImport(filename, source.value);
      const chain = target && findServerChain(target);
      if (!chain) return;
      const server = chain[chain.length - 1];
      context.report({
        node,
        messageId: 'serverModule',
        data: {
          module: relative(server),
          package: ownerOf(server).name,
          chain: chain.map(relative).join(' -> ')
        }
      });
    };

    return {
      Program: (node) => {
        const owner = ownerOf(filename);
        if (owner.runtime === 'server') {
          context.report({
            node,
            messageId: 'serverPackage',
            data: { package: owner.name }
          });
        }
      },
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source)
    };
  }
};

export default rule;
