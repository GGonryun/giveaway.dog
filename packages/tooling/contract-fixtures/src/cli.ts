import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  missingEnv,
  selectRecordings,
  toFixture,
  type FetchJson
} from './recordings.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

const USAGE = `Usage:
  pnpm run fixtures:record [--only <name>]... [--env-file <path>]

Calls each provider with the keys in the environment, removes the secrets
and the personal data from the response, and rewrites the fixture of the
call. --only keeps the calls whose name contains the text, for example
--only scrapebadger. The environment comes from apps/web/.env.local unless
--env-file names another file.`;

const { values } = parseArgs({
  options: {
    only: { type: 'string', multiple: true },
    'env-file': { type: 'string' },
    help: { type: 'boolean' }
  }
});

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

const envFile = values['env-file'] ?? join(ROOT, 'apps/web/.env.local');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const fetchJson: FetchJson = async (url, init) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const { host, pathname } = new URL(url);
    throw new Error(
      `${init?.method ?? 'GET'} ${host}${pathname} returned ${response.status}`
    );
  }
  return response.json();
};

const written: string[] = [];
let failed = 0;

for (const recording of selectRecordings(values.only ?? [])) {
  const missing = missingEnv(recording, process.env);
  if (missing.length > 0) {
    console.log(`skip  ${recording.name}: set ${missing.join(', ')}`);
    continue;
  }
  try {
    const body = recording.sanitize(
      await recording.record(process.env, fetchJson)
    );
    const path = join(ROOT, recording.fixture);
    writeFileSync(
      path,
      `${JSON.stringify(toFixture(body, new Date()), null, 2)}\n`
    );
    written.push(path);
    console.log(`wrote ${recording.name}: ${recording.fixture}`);
  } catch (error) {
    failed++;
    console.error(
      `fail  ${recording.name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

if (written.length > 0) {
  spawnSync('pnpm', ['exec', 'prettier', '--write', ...written], {
    cwd: ROOT,
    stdio: 'inherit'
  });
}

console.log(
  `\n${written.length} fixtures recorded, ${failed} failed. Check each changed fixture for personal data, then run the contract tests of the changed packages and update the values they expect.`
);

process.exitCode = failed > 0 ? 1 : 0;
