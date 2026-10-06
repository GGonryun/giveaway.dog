import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['apps', 'packages', 'tools'];
const SKIPPED = new Set([
  'node_modules',
  '.next',
  '.vitest-reports',
  '.vitest-attachments',
  'coverage'
]);
const SUMMARY = path.join('coverage', 'property', 'coverage-summary.json');
const BASELINE = 'property-coverage.json';
const TOLERANCE = 0.01;
const PURE = new Set(['model', 'util']);

const update = process.argv.includes('--update');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const findPackages = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  if (fs.existsSync(path.join(directory, 'package.json'))) {
    return [directory];
  }
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !SKIPPED.has(entry.name))
    .flatMap((entry) => findPackages(path.join(directory, entry.name)));
};

const hasPropertyTests = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .some((entry) =>
      entry.isDirectory()
        ? !SKIPPED.has(entry.name) &&
          hasPropertyTests(path.join(directory, entry.name))
        : entry.name.endsWith('.property.test.ts')
    );

const round = (value) => Math.round(value * 100) / 100;

const percent = (covered, total) =>
  total === 0 ? 100 : round((covered / total) * 100);

const packages = ROOTS.flatMap(findPackages).map((directory) => {
  const {
    name,
    scripts = {},
    nx: { tags = [] } = {}
  } = readJson(path.join(directory, 'package.json'));
  const type = tags.find((tag) => tag.startsWith('type:'))?.slice(5);
  return { directory, name, scripts, type };
});

const results = packages
  .filter(({ directory }) => fs.existsSync(path.join(directory, SUMMARY)))
  .map(({ directory, name, type }) => {
    const { covered, total } = readJson(path.join(directory, SUMMARY)).total
      .lines;
    return {
      name,
      type,
      pure: PURE.has(type),
      covered,
      total,
      pct: percent(covered, total)
    };
  })
  .filter(({ total }) => total > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

const baseline = fs.existsSync(BASELINE) ? readJson(BASELINE) : {};

if (update) {
  const next = { ...baseline };
  for (const { name, covered, pct } of results) {
    const floor = baseline[name];
    if (covered === 0) {
      if (floor !== undefined) {
        console.log(`${name}: removed the floor of ${floor}%`);
      }
      delete next[name];
    } else if (floor === undefined) {
      console.log(`${name}: added a floor of ${pct}%`);
      next[name] = pct;
    } else if (pct < floor) {
      console.log(`${name}: lowered the floor from ${floor}% to ${pct}%`);
      next[name] = pct;
    } else if (pct > floor) {
      console.log(
        `${name}: kept the floor of ${floor}% (this run: ${pct}%). Raise it by hand to the lowest value of several runs.`
      );
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(next).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(
    `Wrote the floors of ${Object.keys(sorted).length} packages to ${BASELINE}.`
  );
  process.exit(0);
}

const lines = [];
const print = (line = '') => lines.push(line);

print('## Property coverage');
print();

if (results.length === 0) {
  print(
    'No project with a `test:property` target was run, so there is no property coverage to report.'
  );
} else {
  const tested = results.filter(({ covered }) => covered > 0);
  const untested = results
    .filter(({ covered }) => covered === 0)
    .sort((a, b) => b.total - a.total);
  const pure = results.filter((result) => result.pure);
  const covered = pure.reduce((sum, result) => sum + result.covered, 0);
  const total = pure.reduce((sum, result) => sum + result.total, 0);
  const overall = percent(covered, total);

  const drops = results.filter(
    ({ name, pct }) =>
      baseline[name] !== undefined && pct < baseline[name] - TOLERANCE
  );

  if (pure.length === 0) {
    print(
      'No `model` or `util` package was run, so there is no total to report.'
    );
  } else {
    print(
      `Property tests cover **${overall}%** of the lines (${covered}/${total}) of the ${pure.length} \`model\` and \`util\` packages that ran. ${pure.filter((result) => result.covered > 0).length} of them have property tests.`
    );
  }
  print();
  print(
    'Each package with property tests has a floor in `property-coverage.json`. Packages of other types run their property tests too, but do not count toward the total.'
  );
  print();
  print('| Package | Type | Lines | Coverage | Floor | |');
  print('| --- | --- | --- | --- | --- | --- |');
  for (const { name, type, covered, total, pct } of tested) {
    const floor = baseline[name];
    const status =
      floor === undefined
        ? 'no floor'
        : pct < floor - TOLERANCE
          ? 'below the floor'
          : 'ok';
    print(
      `| \`${name}\` | ${type ?? '-'} | ${covered}/${total} | ${pct}% | ${floor === undefined ? '-' : `${floor}%`} | ${status} |`
    );
  }

  if (untested.length > 0) {
    print();
    print(`### Packages with no property tests (${untested.length})`);
    print();
    print(
      'Largest first. Each one is a candidate for a `<name>.property.test.ts` file.'
    );
    print();
    for (const { name, total } of untested) {
      print(`- \`${name}\` (${total} ${total === 1 ? 'line' : 'lines'})`);
    }
  }

  if (drops.length > 0) {
    print();
    print('### Property coverage dropped');
    print();
    for (const { name, pct } of drops) {
      print(`- \`${name}\`: ${pct}%, below its floor of ${baseline[name]}%`);
    }
    print();
    print(
      `Add property tests for the new code, or, if the drop is intended, run \`pnpm run test:property:coverage\` and then \`pnpm run test:property:coverage:update\`, and commit \`${BASELINE}\`. fast-check draws new inputs on each run, so the coverage of a package can change from run to run. If the code of the package did not change, lower its floor to the lowest value of several runs.`
    );
    process.exitCode = 1;
  }

  if (process.env.GITHUB_OUTPUT && pure.length > 0) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `lines=${overall}\n`);
  }
}

const unrun = packages.filter(
  ({ directory, scripts }) =>
    !scripts['test:property'] && hasPropertyTests(directory)
);

if (unrun.length > 0) {
  print();
  print('### Property tests that CI does not run');
  print();
  for (const { name } of unrun) {
    print(`- \`${name}\``);
  }
  print();
  print(
    'The `server` project leaves out the `*.property.test.ts` files, and CI runs them only through the `test:property` target. Add `"test:property": "vitest run --project property --passWithNoTests"` to the scripts of each package above.'
  );
  process.exitCode = 1;
}

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
