import fs from 'node:fs';
import path from 'node:path';

const [kind] = process.argv.slice(2);
if (!kind) {
  console.error('Usage: node collect-vitest-reports.mjs <server|frontend>');
  process.exit(1);
}

const ROOTS = ['apps', 'packages', 'tools'];
const SKIPPED = new Set(['node_modules', '.next', 'coverage']);
const output = '.vitest-reports';

const findReports = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const report = path.join(directory, output, `${kind}.json`);
  if (fs.existsSync(report)) {
    return [report];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIPPED.has(entry.name))
    .flatMap((entry) => findReports(path.join(directory, entry.name)));
};

fs.mkdirSync(output, { recursive: true });
for (const report of ROOTS.flatMap(findReports)) {
  const project = path.dirname(path.dirname(report));
  const target = path.join(
    output,
    `${project.replaceAll(path.sep, '-')}-${kind}.json`
  );
  fs.copyFileSync(report, target);
  console.log(`${report} -> ${target}`);
}
