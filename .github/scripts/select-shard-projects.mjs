import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [target, shardArgument, shardsArgument] = process.argv.slice(2);
const shard = Number(shardArgument);
const shards = Number(shardsArgument);
if (
  !target ||
  !Number.isInteger(shard) ||
  !Number.isInteger(shards) ||
  shard < 1 ||
  shard > shards
) {
  console.error(
    'Usage: node select-shard-projects.mjs <target> <shard> <shards>'
  );
  process.exit(1);
}

const showProjects = (...options) =>
  JSON.parse(
    execFileSync(
      'pnpm',
      ['nx', 'show', 'projects', '--withTarget', target, '--json', ...options],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
    )
  );

const all = showProjects().sort();
const selected = new Set(
  process.env.NX_RUN === 'affected' ? showProjects('--affected') : all
);
const projects = all.filter(
  (project, index) => index % shards === shard - 1 && selected.has(project)
);

console.log(
  `${target}, shard ${shard} of ${shards}: ${projects.length} of the ${selected.size} selected projects`
);
for (const project of projects) {
  console.log(`- ${project}`);
}
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `projects=${projects.join(',')}\n`
  );
}
