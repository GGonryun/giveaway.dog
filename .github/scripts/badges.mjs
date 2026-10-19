import fs from 'node:fs';
import path from 'node:path';

import {
  appendHistory,
  now,
  runUrl,
  writeBadges,
  writeSummary
} from './badge-files.mjs';

const [outputDir, resultsDir = 'test-results'] = process.argv.slice(2);
if (!outputDir) {
  console.error('Usage: node badges.mjs <badges folder> [test results folder]');
  process.exit(1);
}

const HISTORY = 'history.csv';
const TEST_KINDS = [
  'server',
  'property',
  'frontend',
  'snapshot',
  'visual',
  'integration'
];
const COLUMNS = [
  'date',
  'commit',
  'coverage',
  'server_coverage',
  'frontend_coverage',
  'property_coverage',
  ...TEST_KINDS.flatMap((kind) => [`${kind}_passed`, `${kind}_failed`]),
  'mutation_killed',
  'mutation_checked',
  'e2e',
  'run'
];

const needs = JSON.parse(process.env.NEEDS || '{}');

const value = (name) => {
  const text = process.env[name]?.trim();
  return text ? text : undefined;
};

const count = (number) => number.toLocaleString('en-US');

const readTotals = () => {
  const totals = {};
  if (!fs.existsSync(resultsDir)) {
    return totals;
  }
  for (const file of fs.readdirSync(resultsDir)) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const shard = JSON.parse(
      fs.readFileSync(path.join(resultsDir, file), 'utf8')
    );
    const kind = (totals[shard.kind] ??= { passed: 0, failed: 0 });
    kind.passed += shard.passed;
    kind.failed += shard.failed;
  }
  return totals;
};

const badges = [];
const row = {};

const coverageBadge = (id, label, column, text) => {
  const pct = Number(text);
  if (text === undefined || Number.isNaN(pct)) {
    return;
  }
  row[column] = pct;
  badges.push({
    id,
    label,
    message: `${pct}%`,
    color: pct >= 80 ? 'brightgreen' : pct >= 50 ? 'yellow' : 'red'
  });
};

coverageBadge('coverage', 'coverage', 'coverage', value('COVERAGE'));
coverageBadge(
  'server-coverage',
  'server coverage',
  'server_coverage',
  value('SERVER_COVERAGE')
);
coverageBadge(
  'frontend-coverage',
  'frontend coverage',
  'frontend_coverage',
  value('FRONTEND_COVERAGE')
);
coverageBadge(
  'property-coverage',
  'property coverage',
  'property_coverage',
  value('PROPERTY_COVERAGE')
);

const totals = readTotals();
for (const kind of TEST_KINDS) {
  const result = needs[kind]?.result;
  const counts = totals[kind];
  if (counts) {
    row[`${kind}_passed`] = counts.passed;
    row[`${kind}_failed`] = counts.failed;
  }
  const label = `${kind} tests`;
  if (result === 'success' && counts && counts.passed > 0) {
    badges.push({
      id: `${kind}-tests`,
      label,
      message: `${count(counts.passed)} passed`,
      color: 'brightgreen'
    });
  } else if (result === 'failure') {
    badges.push({
      id: `${kind}-tests`,
      label,
      message: counts?.failed ? `${count(counts.failed)} failed` : 'failing',
      color: 'red'
    });
  }
}

const mutation = needs.mutation;
const checked = Number(mutation?.outputs?.checked);
const killed = Number(mutation?.outputs?.killed);
const survived = Number(mutation?.outputs?.failed);
if (checked > 0) {
  row.mutation_killed = killed;
  row.mutation_checked = checked;
}
if (mutation?.result === 'success' && checked > 0) {
  badges.push({
    id: 'mutation-tests',
    label: 'mutation tests',
    message: `${count(killed)}/${count(checked)} killed`,
    color: 'brightgreen'
  });
} else if (mutation?.result === 'failure') {
  badges.push({
    id: 'mutation-tests',
    label: 'mutation tests',
    message: survived > 0 ? `${count(survived)} survived` : 'failing',
    color: 'red'
  });
}

const e2e = value('E2E');
if (e2e === 'success' || e2e === 'failure' || e2e === 'error') {
  const passed = e2e === 'success';
  row.e2e = passed ? 'passed' : 'failed';
  badges.push({
    id: 'e2e-tests',
    label: 'e2e tests',
    message: row.e2e,
    color: passed ? 'brightgreen' : 'red'
  });
}

const README_BADGES = [
  ['coverage', 'coverage'],
  ['server-coverage', 'server coverage'],
  ['frontend-coverage', 'frontend coverage'],
  ['property-coverage', 'property coverage'],
  ...TEST_KINDS.map((kind) => [`${kind}-tests`, `${kind} tests`]),
  ['mutation-tests', 'mutation tests'],
  ['e2e-tests', 'e2e tests'],
  ['production-checks', 'production checks']
];

const written = writeBadges(outputDir, badges, README_BADGES);

appendHistory(path.join(outputDir, HISTORY), COLUMNS, {
  ...row,
  date: now(),
  commit: process.env.GITHUB_SHA ?? '',
  run: runUrl()
});

writeSummary(
  'Badges',
  written,
  'A badge that is not in this table keeps its last value, because its job did not run or did not report a result.'
);
