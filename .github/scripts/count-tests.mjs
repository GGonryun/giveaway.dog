import fs from 'node:fs';
import path from 'node:path';

const [kind, shard] = process.argv.slice(2);
if (!kind || !shard) {
  console.error('Usage: node count-tests.mjs <kind> <shard>');
  process.exit(1);
}

const ROOTS = ['apps', 'packages', 'tools'];
const SKIPPED = new Set([
  'node_modules',
  '.next',
  '.vitest-reports',
  'coverage',
  'src'
]);
const RESULTS = path.join('.vitest-results', `${kind}.json`);
const OUTPUT = 'test-results';

const findResults = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const results = path.join(directory, RESULTS);
  if (fs.existsSync(results)) {
    return [results];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIPPED.has(entry.name))
    .flatMap((entry) => findResults(path.join(directory, entry.name)));
};

const totals = { kind, projects: 0, passed: 0, failed: 0, skipped: 0 };
for (const file of ROOTS.flatMap(findResults)) {
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  totals.projects += 1;
  totals.passed += result.numPassedTests;
  totals.failed += result.numFailedTests;
  totals.skipped += result.numPendingTests + result.numTodoTests;
}

fs.mkdirSync(OUTPUT, { recursive: true });
fs.writeFileSync(
  path.join(OUTPUT, `${kind}-${shard}.json`),
  `${JSON.stringify(totals)}\n`
);
console.log(
  `${kind} tests, shard ${shard}: ${totals.passed} passed, ${totals.failed} failed and ${totals.skipped} skipped in ${totals.projects} projects`
);
