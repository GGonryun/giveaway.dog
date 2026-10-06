import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['apps', 'packages', 'tools'];
const SKIPPED = new Set([
  'node_modules',
  '.next',
  '.vitest-reports',
  'coverage',
  'src'
]);
const SUMMARY = path.join('coverage', 'property', 'coverage-summary.json');
const COUNTED = new Set(['model', 'util']);

const findPackages = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  if (fs.existsSync(path.join(directory, SUMMARY))) {
    return [directory];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIPPED.has(entry.name))
    .flatMap((entry) => findPackages(path.join(directory, entry.name)));
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const round = (value) => Math.round(value * 100) / 100;

const percent = (covered, total) =>
  total === 0 ? 100 : round((covered / total) * 100);

const packageType = ({ nx }) =>
  (nx?.tags ?? [])
    .find((tag) => tag.startsWith('type:'))
    ?.slice('type:'.length) ?? 'app';

const results = ROOTS.flatMap(findPackages)
  .map((directory) => {
    const manifest = readJson(path.join(directory, 'package.json'));
    const { covered, total } = readJson(path.join(directory, SUMMARY)).total
      .lines;
    const type = packageType(manifest);
    return {
      name: manifest.name,
      type,
      counted: COUNTED.has(type),
      covered,
      total,
      pct: percent(covered, total)
    };
  })
  .filter(({ total }) => total > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

const lines = [];
const print = (line = '') => lines.push(line);

print('## Property coverage');
print();

if (results.length === 0) {
  print(
    'No project with a `test:property` target ran, so there is no property coverage to report.'
  );
} else {
  const counted = results.filter((result) => result.counted);
  const tested = results.filter(({ covered }) => covered > 0);
  const untested = counted
    .filter(({ covered }) => covered === 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  if (counted.length === 0) {
    print(
      'No `model` or `util` package ran, so there is no total property coverage.'
    );
  } else {
    const covered = counted.reduce((sum, result) => sum + result.covered, 0);
    const total = counted.reduce((sum, result) => sum + result.total, 0);
    const overall = percent(covered, total);
    const countedWithTests = counted.filter((result) => result.covered > 0);
    print(
      `Property tests cover **${overall}%** of the lines (${covered}/${total}) of the ${counted.length} \`model\` and \`util\` packages that ran. ${countedWithTests.length} of them have property tests.`
    );
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `lines=${overall}\n`);
    }
  }

  if (tested.length > 0) {
    print();
    print(
      'The packages with property tests. Only the `model` and `util` packages count toward the total.'
    );
    print();
    print('| Package | Type | Lines | Coverage |');
    print('| --- | --- | --- | --- |');
    for (const { name, type, covered, total, pct } of tested) {
      print(`| \`${name}\` | ${type} | ${covered}/${total} | ${pct}% |`);
    }
  }

  if (untested.length > 0) {
    print();
    print(
      `### \`model\` and \`util\` packages with no property tests (${untested.length})`
    );
    print();
    print(
      'Largest first. Each one is a candidate for a `<name>.property.test.ts` file.'
    );
    print();
    for (const { name, total } of untested) {
      print(`- \`${name}\` (${total} ${total === 1 ? 'line' : 'lines'})`);
    }
  }
}

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
