import { execFileSync } from 'node:child_process';

const [base = 'origin/main', head = 'HEAD'] = process.argv.slice(2);

const SPEC = /^docs\/spec\//;
const CODE = /^(apps\/web\/|packages\/(?!tooling\/))/;
const TEST =
  /(^|\/)(__tests__|__snapshots__|__screenshots__)\/|\/src\/testing\/|\.test\.tsx?$/;

const changed = execFileSync(
  'git',
  ['diff', '--name-only', '--no-renames', `${base}...${head}`],
  { encoding: 'utf8' }
)
  .split('\n')
  .filter(Boolean);

const specFiles = changed.filter((file) => SPEC.test(file));
const codeFiles = changed.filter((file) => CODE.test(file) && !TEST.test(file));

const list = (files) => files.map((file) => `  ${file}`).join('\n');

if (specFiles.length > 0 && codeFiles.length > 0) {
  const message =
    'This change edits the spec and the application code together. Move the spec changes and the code changes to separate pull requests (see docs/spec/README.md).';
  console.error(
    process.env.GITHUB_ACTIONS ? `::error::${message}` : `error: ${message}`
  );
  console.error(`\nSpec files:\n${list(specFiles)}`);
  console.error(`\nApplication code:\n${list(codeFiles)}`);
  process.exit(1);
}

console.log(
  specFiles.length > 0
    ? `The change edits the spec (${specFiles.length} file(s)) and no application code.`
    : codeFiles.length > 0
      ? `The change edits the application code (${codeFiles.length} file(s)) and not the spec.`
      : 'The change edits neither the spec nor the application code.'
);
