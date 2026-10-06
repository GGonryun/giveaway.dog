import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TARGETS = [
  'lint',
  'type-check',
  'test:server',
  'test:frontend',
  'test:snapshot',
  'test:visual:docker',
  'test:integration'
];

const [shard, count] = process.argv.slice(2).map(Number);
if (!Number.isInteger(count) || count < 1 || !(shard >= 1 && shard <= count)) {
  console.error('Usage: node select-shard-projects.mjs <shard> <count>');
  process.exit(1);
}

const nx = (...args) =>
  execFileSync('pnpm', ['exec', 'nx', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });

const directory = mkdtempSync(path.join(tmpdir(), 'nx-graph-'));
const graphFile = path.join(directory, 'graph.json');
nx('graph', `--file=${graphFile}`);
const { nodes } = JSON.parse(readFileSync(graphFile, 'utf8')).graph;
rmSync(directory, { recursive: true, force: true });

const projects = Object.keys(nodes).sort();
const affected = process.env.NX_RUN === 'affected';
const selected = new Set(
  affected
    ? JSON.parse(nx('show', 'projects', '--affected', '--json'))
    : projects
);
const shardProjects = projects.filter(
  (project, index) => index % count === shard - 1 && selected.has(project)
);

const scope = affected ? 'affected projects' : 'projects';
console.log(
  `Shard ${shard} of ${count}: ${shardProjects.length} of the ${selected.size} ${scope}`
);
const outputs = TARGETS.map((target) => {
  const withTarget = shardProjects.filter(
    (project) => target in (nodes[project].data.targets ?? {})
  );
  console.log(`- ${target}: ${withTarget.length}`);
  return `${target.replaceAll(':', '-')}=${withTarget.join(',')}\n`;
});

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, outputs.join(''));
} else {
  process.stdout.write(outputs.join(''));
}
