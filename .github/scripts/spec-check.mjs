import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SPEC_DIRECTORY = path.join('docs', 'spec');
const SPEC_README = 'README.md';
const TEST_ROOTS = ['apps', 'packages'];
const TEST_FILE = /\.(test|spec)\.(ts|tsx|mts|js|mjs)$/;
const ID = /^[A-Z][A-Z0-9]*-\d{3}$/;
const RULE_LINE = /^\s*[-*] `([^`]+)`\s+\S/;
const TITLE_ID = /\[([A-Z][A-Z0-9]*-\d{3})\]/g;
const TEST_CALL =
  /\b(it|test|describe)((?:\.[A-Za-z]+)*)\(\s*(['"`])((?:\\.|(?!\3)[^\\\n])*)\3/g;
const PENDING = new Set(['todo', 'fixme']);
const SKIPPED = new Set(['skip']);
const KNOWN_BUG = new Set(['fails', 'fail']);
const KNOWN_BUG_DETAILS = /^\s*,\s*(?:(?!=>)[^,])*?\bknownBug\(/;

const readRules = () => {
  const rules = new Map();
  const errors = [];
  const files = fs
    .readdirSync(SPEC_DIRECTORY)
    .filter((name) => name.endsWith('.md') && name !== SPEC_README)
    .sort();
  for (const name of files) {
    const file = path.join(SPEC_DIRECTORY, name);
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const match = RULE_LINE.exec(line);
        if (!match) {
          return;
        }
        const [, id] = match;
        const location = `${file}:${index + 1}`;
        if (!ID.test(id)) {
          errors.push(
            `${location}: \`${id}\` is not a rule ID (capital letters, a dash and three digits)`
          );
          return;
        }
        if (rules.has(id)) {
          errors.push(
            `${location}: ${id} is also the ID of a rule at ${rules.get(id)}`
          );
          return;
        }
        rules.set(id, location);
      });
  }
  return { rules, errors };
};

const listTestFiles = () =>
  execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      ...TEST_ROOTS
    ],
    { encoding: 'utf8' }
  )
    .split('\n')
    .filter((file) => TEST_FILE.test(file) && fs.existsSync(file));

const kindOf = (modifiers, rest) => {
  const names = modifiers.split('.').filter(Boolean);
  if (names.some((name) => PENDING.has(name))) {
    return 'pending';
  }
  if (names.some((name) => SKIPPED.has(name))) {
    return 'skipped';
  }
  if (
    names.some((name) => KNOWN_BUG.has(name)) ||
    KNOWN_BUG_DETAILS.test(rest)
  ) {
    return 'knownBug';
  }
  return 'test';
};

const readTests = () => {
  const tests = [];
  for (const file of listTestFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(TEST_CALL)) {
      const [, , modifiers, , title] = match;
      const line = source.slice(0, match.index).split('\n').length;
      const end = match.index + match[0].length;
      const rest = source.slice(end, end + 200);
      for (const [, id] of title.matchAll(TITLE_ID)) {
        tests.push({
          id,
          kind: kindOf(modifiers, rest),
          location: `${file}:${line}`,
          title
        });
      }
    }
  }
  return tests;
};

const { rules, errors } = readRules();
const tests = readTests();

const testsOf = (id) => tests.filter((test) => test.id === id);
const covers = (test) => test.kind !== 'skipped';

for (const test of tests) {
  if (!rules.has(test.id)) {
    errors.push(
      `${test.location}: the test "${test.title}" names ${test.id}, which no rule in ${SPEC_DIRECTORY} has`
    );
  }
}

const rows = [...rules].map(([id, location]) => {
  const ruleTests = testsOf(id).filter(covers);
  const count = (kind) => ruleTests.filter((test) => test.kind === kind).length;
  const status =
    ruleTests.length === 0
      ? 'untested'
      : count('test') + count('knownBug') === 0
        ? 'pending'
        : count('knownBug') > 0
          ? 'known bug'
          : 'tested';
  if (status === 'untested') {
    errors.push(
      `${location}: ${id} has no test. Name it in the title of a test, for example it('[${id}] ...'), or add it.todo('[${id}] ...') while the app does not follow it yet`
    );
  }
  return { id, status, tests: count('test'), knownBugs: count('knownBug') };
});

const byStatus = (status) => rows.filter((row) => row.status === status);
const listed = (status) =>
  byStatus(status)
    .map(({ id }) => id)
    .join(', ');

const summary = [
  `${rules.size} rules in ${SPEC_DIRECTORY}, ${tests.length} test titles name a rule ID.`,
  `Tested: ${byStatus('tested').length}. With a known bug: ${byStatus('known bug').length}. Pending: ${byStatus('pending').length}. Without a test: ${byStatus('untested').length}.`,
  ...(byStatus('known bug').length
    ? [`Rules with a known bug: ${listed('known bug')}.`]
    : []),
  ...(byStatus('pending').length
    ? [`Pending rules: ${listed('pending')}.`]
    : [])
];

console.log(summary.join('\n'));

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '## Spec',
      '',
      ...summary.map((line) => `${line}\n`),
      '| Rule | Status | Tests | Known bugs |',
      '| --- | --- | --- | --- |',
      ...rows.map(
        ({ id, status, tests: count, knownBugs }) =>
          `| ${id} | ${status} | ${count} | ${knownBugs} |`
      ),
      ...(errors.length
        ? ['', '### Errors', '', ...errors.map((error) => `- ${error}`)]
        : []),
      ''
    ].join('\n')
  );
}

if (errors.length > 0) {
  console.error('');
  for (const error of errors) {
    console.error(
      process.env.GITHUB_ACTIONS ? `::error::${error}` : `error: ${error}`
    );
  }
  console.error(
    `\nThe spec check found ${errors.length} error(s). See docs/spec/README.md.`
  );
  process.exit(1);
}
