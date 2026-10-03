import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { Node, Project } from 'ts-morph';
import { packageFiles } from './package-files.ts';
import { SUPPRESSIONS, sortKeys } from './plan.ts';
import type { Plan } from './plan.ts';
import { APP_ROOT, PACKAGE_MAP, readJson } from './workspace.ts';
import type { PackageMap, Workspace } from './workspace.ts';

export const NEXT_CONFIG = `${APP_ROOT}/next.config.ts`;

type PackageManifest = Record<string, unknown> & {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const write = (root: string, file: string, text: string) => {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, text);
};

const removeEmptyDirectories = (root: string, files: string[]) => {
  const directories = [
    ...new Set(files.map((file) => path.posix.dirname(file)))
  ];
  for (let dir of directories) {
    while (dir.startsWith(APP_ROOT + '/')) {
      const absolute = path.join(root, dir);
      if (!fs.existsSync(absolute) || fs.readdirSync(absolute).length) break;
      fs.rmdirSync(absolute);
      dir = path.posix.dirname(dir);
    }
  }
};

const moveFiles = (ws: Workspace, plan: Plan) => {
  for (const move of plan.moves) {
    const target = path.join(ws.root, move.to);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (ws.tracked.has(move.from)) {
      execFileSync('git', ['mv', move.from, move.to], { cwd: ws.root });
    } else {
      fs.renameSync(path.join(ws.root, move.from), target);
    }
  }
  removeEmptyDirectories(
    ws.root,
    plan.moves.map((move) => move.from)
  );
};

const addTranspilePackages = (root: string, names: string[]) => {
  const absolute = path.join(root, NEXT_CONFIG);
  const text = fs.readFileSync(absolute, 'utf8');
  const project = new Project({ useInMemoryFileSystem: true });
  const source = project.createSourceFile('/next.config.ts', text);
  const property = source
    .getDescendants()
    .find(
      (node) =>
        Node.isPropertyAssignment(node) &&
        node.getName() === 'transpilePackages'
    );
  const array = Node.isPropertyAssignment(property)
    ? property.getInitializer()
    : undefined;
  if (!Node.isArrayLiteralExpression(array)) {
    throw new Error(`${NEXT_CONFIG} has no transpilePackages array`);
  }
  const current = array
    .getElements()
    .filter(Node.isStringLiteral)
    .map((element) => element.getLiteralText());
  const merged = [...new Set([...current, ...names])].sort();
  const replacement = `[${merged.map((name) => `'${name}'`).join(', ')}]`;
  fs.writeFileSync(
    absolute,
    text.slice(0, array.getStart()) + replacement + text.slice(array.getEnd())
  );
};

const updateManifest = (
  root: string,
  file: string,
  section: 'dependencies' | 'devDependencies',
  names: Iterable<string>
) => {
  const manifest = readJson<PackageManifest>(root, file);
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {})
  ]);
  const missing = [...names].filter((name) => !declared.has(name));
  if (!missing.length) return false;
  const current = manifest[section] ?? {};
  for (const name of missing) current[name] = 'workspace:*';
  manifest[section] = sortKeys(current);
  write(root, file, JSON.stringify(manifest, null, 2) + '\n');
  return true;
};

const updatePackageMap = (ws: Workspace, plan: Plan) => {
  const map = readJson<PackageMap & Record<string, unknown>>(
    ws.root,
    PACKAGE_MAP
  );
  const moved = new Map(plan.packages.map((pkg) => [pkg.entry.name, pkg]));
  const known = new Set(map.packages.map((entry) => entry.name));
  for (const entry of map.packages) {
    const pkg = moved.get(entry.name);
    if (!pkg) continue;
    const internal = Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies
    }).filter((name) => known.has(name));
    entry.sources = [];
    entry.dependsOn = [...new Set([...entry.dependsOn, ...internal])].sort();
    entry.npm = entry.npm.filter((name) => !internal.includes(name));
  }
  const fixtures = new Set(
    plan.moves
      .filter((move) => move.kind === 'fixture')
      .map((move) => move.from.slice(APP_ROOT.length + 1))
  );
  map.testFixtures = Object.fromEntries(
    Object.entries(map.testFixtures).filter(([file]) => !fixtures.has(file))
  );
  write(ws.root, PACKAGE_MAP, JSON.stringify(map, null, 2) + '\n');
};

const updateSuppressions = (ws: Workspace, plan: Plan) => {
  if (!plan.suppressions) return false;
  const moved = new Set(plan.moves.map((move) => move.from));
  const remaining = Object.fromEntries(
    Object.entries(plan.suppressions).filter(([file]) => !moved.has(file))
  );
  if (Object.keys(remaining).length === Object.keys(plan.suppressions).length) {
    return false;
  }
  const original = fs.readFileSync(path.join(ws.root, SUPPRESSIONS), 'utf8');
  const newline = original.endsWith('\n') ? '\n' : '';
  write(ws.root, SUPPRESSIONS, JSON.stringify(remaining, null, 2) + newline);
  return true;
};

const format = async (root: string, files: string[]) => {
  const ignorePath = path.join(root, '.prettierignore');
  for (const file of [...new Set(files)].sort()) {
    const absolute = path.join(root, file);
    const info = await prettier.getFileInfo(absolute, {
      ignorePath: fs.existsSync(ignorePath) ? ignorePath : undefined
    });
    if (info.ignored || !info.inferredParser) continue;
    const options = await prettier.resolveConfig(absolute);
    const text = fs.readFileSync(absolute, 'utf8');
    const formatted = await prettier.format(text, {
      ...options,
      filepath: absolute
    });
    if (formatted !== text) fs.writeFileSync(absolute, formatted);
  }
};

export type ApplyOptions = { install: boolean };

export const applyPlan = async (
  ws: Workspace,
  plan: Plan,
  options: ApplyOptions
) => {
  const { root } = ws;
  const changed: string[] = [];

  moveFiles(ws, plan);
  for (const [file, text] of plan.contents) {
    write(root, file, text);
    changed.push(file);
  }

  for (const pkg of plan.packages) {
    for (const [name, text] of Object.entries(packageFiles(pkg))) {
      const file = `${pkg.entry.path}/${name}`;
      write(root, file, text);
      changed.push(file);
    }
  }

  const names = plan.packages.map((pkg) => pkg.entry.name).sort();
  addTranspilePackages(root, names);
  changed.push(NEXT_CONFIG);
  if (updateManifest(root, `${APP_ROOT}/package.json`, 'dependencies', names)) {
    changed.push(`${APP_ROOT}/package.json`);
  }
  for (const [project, record] of plan.importers) {
    const file = `${project}/package.json`;
    const updated = [
      updateManifest(root, file, 'dependencies', record.dependencies),
      updateManifest(root, file, 'devDependencies', record.dev)
    ];
    if (updated.some(Boolean)) changed.push(file);
  }
  updatePackageMap(ws, plan);
  changed.push(PACKAGE_MAP);
  updateSuppressions(ws, plan);

  await format(root, changed);

  if (options.install) {
    execFileSync('pnpm', ['install'], { cwd: root, stdio: 'inherit' });
  }
  return changed;
};
