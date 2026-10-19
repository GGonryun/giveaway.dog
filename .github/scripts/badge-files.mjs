import fs from 'node:fs';
import path from 'node:path';

const badgeFile = (outputDir, id) => path.join(outputDir, `${id}.json`);

export const writeBadges = (outputDir, badges, placeholders = []) => {
  fs.mkdirSync(outputDir, { recursive: true });
  const written = [...badges];
  for (const [id, label] of placeholders) {
    if (
      !written.some((badge) => badge.id === id) &&
      !fs.existsSync(badgeFile(outputDir, id))
    ) {
      written.push({ id, label, message: 'no result yet', color: 'lightgrey' });
    }
  }
  for (const { id, label, message, color } of written) {
    fs.writeFileSync(
      badgeFile(outputDir, id),
      `${JSON.stringify({ schemaVersion: 1, label, message, color }, null, 2)}\n`
    );
  }
  return written;
};

export const runUrl = () =>
  process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '';

export const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

export const appendHistory = (historyFile, columns, row) => {
  const rows = [];
  if (fs.existsSync(historyFile)) {
    const [header, ...lines] = fs
      .readFileSync(historyFile, 'utf8')
      .split('\n')
      .filter(Boolean);
    const names = header.split(',');
    for (const line of lines) {
      const cells = line.split(',');
      rows.push(Object.fromEntries(names.map((name, i) => [name, cells[i]])));
    }
  }
  rows.push(row);
  fs.writeFileSync(
    historyFile,
    [
      columns.join(','),
      ...rows.map((entry) => columns.map((name) => entry[name] ?? '').join(','))
    ].join('\n') + '\n'
  );
};

export const writeSummary = (title, badges, note) => {
  const summary = [
    `## ${title}`,
    '',
    badges.length === 0
      ? 'No badge changed.'
      : '| Badge | Value |\n| --- | --- |\n' +
        badges
          .map(({ label, message }) => `| ${label} | ${message} |`)
          .join('\n'),
    '',
    note
  ].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
};
