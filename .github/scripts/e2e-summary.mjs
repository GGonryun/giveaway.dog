import fs from 'node:fs';

const [report] = process.argv.slice(2);
if (!report) {
  console.error('Usage: node e2e-summary.mjs <playwright-json-report>');
  process.exit(1);
}

if (!fs.existsSync(report)) {
  console.log(
    '## E2E tests\n\nNo Playwright report: the run stopped before the tests ended.'
  );
  process.exit(0);
}

const {
  suites = [],
  stats,
  errors = []
} = JSON.parse(fs.readFileSync(report, 'utf8'));

const ANSI = /\u001b\[[0-9;]*m/g;

const cell = (text = '') =>
  String(text)
    .replace(ANSI, '')
    .replace(/\|/g, '\\|')
    .replace(/\s+/g, ' ')
    .trim();

const firstLine = (message = '') =>
  cell(
    message
      .replace(ANSI, '')
      .split('\n')
      .find((line) => line.trim())
  ).slice(0, 200);

const errorOf = (result) =>
  firstLine(result?.error?.message ?? result?.errors?.[0]?.message);

const collect = (suite, titles) => {
  const path = [...titles, suite.title];
  return [
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.map((test) => ({ spec, test, titles: path }))
    ),
    ...(suite.suites ?? []).flatMap((child) => collect(child, path))
  ];
};

const tests = suites
  .flatMap((suite) => collect(suite, []))
  .map(({ spec, test, titles }) => {
    const results = test.results ?? [];
    const last = results.at(-1);
    return {
      title: [...titles.slice(1), spec.title].join(' › '),
      location: `${spec.file}:${spec.line}`,
      project: test.projectName,
      status: test.status,
      knownBug: (spec.tags ?? []).includes('known-bug'),
      issue: test.annotations?.find((annotation) => annotation.type === 'issue')
        ?.description,
      lastStatus: last?.status,
      lastError: errorOf(last),
      firstError: errorOf(results.find((result) => result.status !== 'passed'))
    };
  });

const issueLink = (url) => {
  const number = url?.match(/\/issues\/(\d+)$/)?.[1];
  return number ? `[#${number}](${url})` : (url ?? 'No issue');
};

const knownBugs = tests.filter(
  (test) => test.knownBug && test.status !== 'skipped'
);
const fixedBugs = knownBugs.filter(
  (test) => test.status === 'unexpected' && test.lastStatus === 'passed'
);
const openBugs = knownBugs.filter((test) => !fixedBugs.includes(test));
const failed = tests.filter(
  (test) => test.status === 'unexpected' && !fixedBugs.includes(test)
);
const flaky = tests.filter((test) => test.status === 'flaky');
const skipped = tests.filter((test) => test.status === 'skipped');
const passed = tests.filter(
  (test) => test.status === 'expected' && !test.knownBug
);

const seconds = Math.round((stats?.duration ?? 0) / 1000);
const lines = [
  '## E2E tests',
  '',
  '| Passed | Failed | Flaky | Known bugs | Skipped | Duration |',
  '| --- | --- | --- | --- | --- | --- |',
  `| ${passed.length} | ${failed.length + fixedBugs.length} | ${flaky.length} | ${openBugs.length} | ${skipped.length} | ${Math.floor(seconds / 60)}m ${seconds % 60}s |`
];

const table = (heading, rows, columns, toRow) => {
  if (rows.length === 0) return;
  lines.push(
    '',
    `### ${heading}`,
    '',
    `| ${columns.join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`
  );
  for (const row of rows) lines.push(`| ${toRow(row).join(' | ')} |`);
};

const where = (test) => [
  cell(test.title),
  test.project,
  `\`${test.location}\``
];

table('Failed', failed, ['Test', 'Project', 'Location', 'Error'], (test) => [
  ...where(test),
  test.lastError || test.lastStatus
]);
table(
  'Known bugs that pass now (remove knownBug from the test, and close the issue)',
  fixedBugs,
  ['Test', 'Project', 'Location', 'Issue'],
  (test) => [...where(test), issueLink(test.issue)]
);
table(
  'Flaky (failed, then passed on retry)',
  flaky,
  ['Test', 'Project', 'Location', 'First error'],
  (test) => [...where(test), test.firstError || '-']
);
table(
  'Known bugs',
  openBugs,
  ['Test', 'Project', 'Location', 'Issue'],
  (test) => [...where(test), issueLink(test.issue)]
);

if (errors.length > 0) {
  lines.push('', '### Errors outside the tests', '');
  for (const error of errors) lines.push(`- ${firstLine(error.message)}`);
}

console.log(lines.join('\n'));
