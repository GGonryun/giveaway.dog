import fs from 'node:fs';

const NEON_API = process.env.NEON_API_URL ?? 'https://console.neon.tech/api/v2';
const GITHUB_API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const PREFIX = 'preview/';
const GRACE_DAYS = 7;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [command, ...gitBranches] = args.filter((arg) => arg !== '--dry-run');
if (
  !(command === 'delete' && gitBranches.length > 0) &&
  !(command === 'sweep' && gitBranches.length === 0)
) {
  console.error(
    'Usage: node neon-preview-branches.mjs delete <git branch>... [--dry-run]\n' +
      '       node neon-preview-branches.mjs sweep [--dry-run]'
  );
  process.exit(2);
}

const required = (name) => {
  const text = process.env[name]?.trim();
  if (!text) {
    console.error(`::error::${name} is not set.`);
    process.exit(1);
  }
  return text;
};

const neonKey = required('NEON_API_KEY');
const projectId = required('NEON_PROJECT_ID');

const request = async (url, init, retries = 3) => {
  const response = await fetch(url, init);
  if ((response.status === 423 || response.status === 503) && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return request(url, init, retries - 1);
  }
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `${init.method} ${url}: ${response.status} ${body.slice(0, 500)}`
    );
  }
  return body ? JSON.parse(body) : {};
};

const neon = (method, path) =>
  request(`${NEON_API}/projects/${encodeURIComponent(projectId)}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${neonKey}`
    }
  });

const github = (path) =>
  request(`${GITHUB_API}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${required('GITHUB_TOKEN')}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

const githubPages = async (path) => {
  const items = [];
  for (let page = 1; ; page++) {
    const separator = path.includes('?') ? '&' : '?';
    const batch = await github(`${path}${separator}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) {
      return items;
    }
  }
};

const previewBranches = async () => {
  const branches = new Map();
  const annotations = {};
  const cursors = new Set();
  let cursor;
  do {
    const query = new URLSearchParams({ limit: '1000' });
    if (cursor) {
      query.set('cursor', cursor);
    }
    const page = await neon('GET', `/branches?${query}`);
    for (const branch of page.branches) {
      branches.set(branch.id, branch);
    }
    Object.assign(annotations, page.annotations);
    cursors.add(cursor);
    cursor = page.branches.length > 0 ? page.pagination?.next : undefined;
  } while (cursor && !cursors.has(cursor));
  return [...branches.values()]
    .filter(
      (branch) =>
        branch.name.startsWith(PREFIX) && !branch.default && !branch.protected
    )
    .map((branch) => ({
      ...branch,
      gitBranch:
        annotations[branch.id]?.value?.['vercel-commit-ref'] ??
        branch.name.slice(PREFIX.length)
    }));
};

const summary = [];
let failures = 0;

const remove = async (branch, reason) => {
  const line = `${branch.name} (${branch.id}): ${reason}`;
  if (dryRun) {
    console.log(`Would delete ${line}`);
    summary.push(`- Would delete \`${branch.name}\`: ${reason}`);
    return;
  }
  try {
    await neon('DELETE', `/branches/${encodeURIComponent(branch.id)}`);
    console.log(`Deleted ${line}`);
    summary.push(`- Deleted \`${branch.name}\`: ${reason}`);
  } catch (error) {
    failures++;
    console.log(`::error::Could not delete ${line}. ${error.message}`);
    summary.push(`- Could not delete \`${branch.name}\`: ${error.message}`);
  }
};

const branches = await previewBranches();
console.log(
  `The Neon project has ${branches.length} preview database branches.`
);

if (command === 'delete') {
  for (const gitBranch of gitBranches) {
    const matches = branches.filter(
      (branch) =>
        branch.gitBranch === gitBranch || branch.name === PREFIX + gitBranch
    );
    if (matches.length === 0) {
      console.log(`No preview database branch for ${gitBranch}.`);
    }
    for (const branch of matches) {
      await remove(branch, `requested for ${gitBranch}`);
    }
  }
} else {
  const repository = required('GITHUB_REPOSITORY');
  const open = new Set(
    (await githubPages(`/repos/${repository}/pulls?state=open`))
      .filter((pull) => pull.head.repo?.full_name === repository)
      .map((pull) => pull.head.ref)
  );
  const cutoff = Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000;
  for (const branch of branches) {
    if (!open.has(branch.gitBranch) && Date.parse(branch.created_at) < cutoff) {
      await remove(
        branch,
        `${branch.gitBranch} has no open pull request, and the database branch is older than ${GRACE_DAYS} days`
      );
    }
  }
}

if (summary.length === 0) {
  console.log('No preview database branch to delete.');
  summary.push('No preview database branch to delete.');
}
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Preview database branches\n\n${summary.join('\n')}\n`
  );
}
process.exit(failures > 0 ? 1 : 0);
