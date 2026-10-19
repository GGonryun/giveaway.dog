import path from 'node:path';

import {
  appendHistory,
  now,
  runUrl,
  writeBadges,
  writeSummary
} from './badge-files.mjs';

const [outputDir] = process.argv.slice(2);
const TARGETS = { held: 'deployment', live: 'domain' };
const target = TARGETS[process.env.KIND];
if (!outputDir || !target) {
  console.error(
    'Usage: KIND=held|live RESULT=<outcome> node production-badge.mjs <badges folder>'
  );
  process.exit(1);
}

const HISTORY = 'production-history.csv';
const COLUMNS = ['date', 'commit', 'url', 'target', 'trigger', 'result', 'run'];

const passed = process.env.RESULT === 'success';
const result = passed ? 'passed' : 'failing';

const written = writeBadges(outputDir, [
  {
    id: 'production-checks',
    label: 'production checks',
    message: result,
    color: passed ? 'brightgreen' : 'red'
  }
]);

appendHistory(path.join(outputDir, HISTORY), COLUMNS, {
  date: now(),
  commit: process.env.SHA ?? '',
  url: process.env.URL ?? '',
  target,
  trigger: process.env.TRIGGER ?? '',
  result,
  run: runUrl()
});

writeSummary(
  'Production checks badge',
  written,
  `The run added a row to ${HISTORY}.`
);
