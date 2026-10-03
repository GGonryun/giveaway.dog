import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

const lines = (...text: string[]) => text.join('\n') + '\n';

const entry = (
  name: string,
  folder: string,
  type: string,
  sources: string[],
  extra: { dependsOn?: string[]; npm?: string[]; scope?: string } = {}
) => ({
  name,
  path: folder,
  type,
  tags: [
    `type:${type}`,
    type === 'server'
      ? 'runtime:server'
      : type === 'ui'
        ? 'runtime:react'
        : 'runtime:isomorphic',
    `scope:${extra.scope ?? 'birds'}`
  ],
  layer: 0,
  sourceFiles: sources.length,
  testFiles: 0,
  sources,
  dependsOn: extra.dependsOn ?? [],
  npm: extra.npm ?? []
});

export const PACKAGE_MAP = {
  version: 1,
  dependencyRules: {},
  refactors: [],
  testFixtures: {
    'lib/kestrel/__tests__/fixtures.ts': {
      package: '@giveaway/kestrel-text',
      split: false
    }
  },
  deadFiles: [],
  packages: [
    entry('apps/web', 'apps/web', 'app', ['lib/consumer.ts'], {
      scope: 'apps'
    }),
    entry('@giveaway/kestrel-text', 'packages/birds/kestrel-text', 'util', [
      'lib/kestrel/countries.json',
      'lib/kestrel/text.ts'
    ]),
    entry(
      '@giveaway/heron-store',
      'packages/birds/heron-store',
      'server',
      ['lib/heron/'],
      {
        dependsOn: ['@giveaway/db-client', '@giveaway/kestrel-text'],
        npm: ['@giveaway/db-model']
      }
    ),
    entry(
      '@giveaway/wren-ui',
      'packages/birds/wren-ui',
      'ui',
      ['components/wren/badge.tsx'],
      {
        dependsOn: ['@giveaway/kestrel-text'],
        npm: ['react']
      }
    ),
    entry(
      '@giveaway/db-client',
      'packages/infra/db-client',
      'server',
      ['lib/prisma.ts'],
      {
        npm: ['@prisma/client'],
        scope: 'infra'
      }
    ),
    entry('@giveaway/db-model', 'packages/infra/db-model', 'model', [], {
      scope: 'infra'
    }),
    entry('@giveaway/owl-types', 'packages/birds/owl-types', 'util', [
      'lib/owl.ts',
      'types/owl/index.ts'
    ]),
    entry('@giveaway/finch-ui', 'packages/birds/finch-ui', 'ui', [
      'components/finch/card.tsx'
    ]),
    entry(
      '@giveaway/testing-server',
      'packages/tooling/testing-server',
      'config',
      [],
      {
        scope: 'tooling'
      }
    )
  ]
};

export const FILES: Record<string, string> = {
  '.gitignore': lines('node_modules'),
  '.prettierignore': lines('pnpm-lock.yaml', 'eslint-suppressions.json'),
  'package.json': json({
    private: true,
    prettier: {
      arrowParens: 'always',
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'none'
    }
  }),
  'pnpm-workspace.yaml': lines(
    'packages:',
    '  - apps/*',
    '  - packages/**',
    '',
    'catalog:',
    "  '@prisma/client': ^6.19.0",
    "  '@testing-library/react': ^16.3.3",
    "  '@types/node': 20.17.6",
    "  '@types/react': 19.2.10",
    '  react: 19.2.4',
    '  server-only: ^0.0.1',
    '  typescript: 5.7.2',
    '  vitest: ^4.0.16'
  ),
  'eslint-suppressions.json': JSON.stringify(
    {
      'apps/web/lib/consumer.ts': {
        '@typescript-eslint/no-explicit-any': { count: 1 }
      },
      'apps/web/lib/heron/index.ts': {
        '@typescript-eslint/no-explicit-any': { count: 2 }
      }
    },
    null,
    2
  ),
  'docs/monorepo/package-map.json': json(PACKAGE_MAP),
  'packages/tooling/testing-server/package.json': json({
    name: '@giveaway/testing-server',
    private: true,
    exports: { './setup': './src/setup.ts' },
    devDependencies: { typescript: 'catalog:' }
  }),
  'packages/tooling/testing-server/src/setup.ts': lines(
    "import { vi } from 'vitest';",
    '',
    "vi.mock('@/lib/prisma', () => ({ default: {} }));"
  ),
  'apps/web/package.json': json({
    name: 'web',
    private: true,
    dependencies: {
      '@giveaway/util-errors': 'workspace:*',
      next: 'catalog:',
      react: 'catalog:'
    }
  }),
  'apps/web/tsconfig.json': json({
    compilerOptions: {
      paths: {
        '@/components/*': ['components/*'],
        '@/lib/*': ['lib/*'],
        '@/types/*': ['types/*']
      }
    }
  }),
  'apps/web/next.config.ts': lines(
    "import { NextConfig } from 'next';",
    '',
    'const nextConfig: NextConfig = {',
    "  transpilePackages: ['@giveaway/util-errors'],",
    '  experimental: {',
    '    useCache: true',
    '  }',
    '};',
    '',
    'export default nextConfig;'
  ),
  'apps/web/lib/kestrel/text.ts': lines(
    "import countries from './countries.json';",
    '',
    'export const shout = (value: string) => value.toUpperCase();',
    '',
    'export const countryCount = () => Object.keys(countries).length;'
  ),
  'apps/web/lib/kestrel/countries.json': json({ fr: 'France' }),
  'apps/web/lib/kestrel/other.ts': lines(
    "import { shout } from './text';",
    '',
    "export const greet = () => shout('hi');"
  ),
  'apps/web/lib/kestrel/__tests__/text.test.ts': lines(
    "import { describe, expect, it } from 'vitest';",
    "import { shout } from '../text';",
    "import { sample } from './fixtures';",
    '',
    "describe('shout', () => {",
    "  it('shouts', () => {",
    "    expect(shout(sample)).toBe('HELLO');",
    '  });',
    '});'
  ),
  'apps/web/lib/kestrel/__tests__/fixtures.ts': lines(
    "export const sample = 'hello';"
  ),
  'apps/web/lib/kestrel/__tests__/text.snapshot.test.tsx': lines(
    "import { expect, it } from 'vitest';",
    "import { shout } from '@/lib/kestrel/text';",
    '',
    "it('matches', () => {",
    "  expect(shout('a')).toMatchSnapshot();",
    '});'
  ),
  'apps/web/lib/kestrel/__tests__/__snapshots__/text.snapshot.test.tsx.snap':
    lines('// Vitest Snapshot v1', '', 'exports[`matches 1`] = `"A"`;'),
  'apps/web/lib/heron/index.ts': lines(
    "import { User } from '@prisma/client';",
    "import prisma from '@/lib/prisma';",
    "import { shout } from '@/lib/kestrel/text';",
    "import { save } from './actions';",
    '',
    'export const load = async (id: string): Promise<User | null> =>',
    '  prisma.user.findUnique({ where: { id: shout(id) } });',
    '',
    'export { save };'
  ),
  'apps/web/lib/heron/actions.ts': lines(
    "'use server';",
    '',
    'export const save = async () => {};'
  ),
  'apps/web/lib/heron/cached.ts': lines(
    "'use cache';",
    '',
    'export const cached = async () => 1;'
  ),
  'apps/web/lib/heron/env.d.ts': lines('declare const HERON_ENV: string;'),
  'apps/web/types/globals.d.ts': lines(
    "declare type Shout = typeof import('@/lib/kestrel/text').shout;"
  ),
  'apps/web/lib/heron/__tests__/index.test.ts': lines(
    "import { describe, expect, it, vi } from 'vitest';",
    "import { load } from '..';",
    '',
    "vi.mock('@/lib/heron/actions', () => ({ save: vi.fn() }));",
    '',
    "type Actions = typeof import('../actions');",
    '',
    "describe('load', () => {",
    "  it('loads', async () => {",
    "    const actual = await vi.importActual<Actions>('../actions');",
    '    expect(actual.save).toBeDefined();',
    '    expect(load).toBeDefined();',
    '  });',
    '});'
  ),
  'apps/web/lib/prisma.ts': lines(
    "import 'server-only';",
    '',
    "import { PrismaClient } from '@prisma/client';",
    '',
    'const prisma = new PrismaClient();',
    '',
    'export default prisma;'
  ),
  'apps/web/components/wren/badge.tsx': lines(
    "import { useMemo } from 'react';",
    "import { shout } from '@/lib/kestrel/text';",
    '',
    'export const Badge = ({ label }: { label: string }) => {',
    '  const text = useMemo(() => shout(label), [label]);',
    '  return <span>{text}</span>;',
    '};'
  ),
  'apps/web/components/wren/__tests__/badge.test.tsx': lines(
    "import { render } from '@testing-library/react';",
    "import { it } from 'vitest';",
    "import { Badge } from '../badge';",
    '',
    "it('renders', () => {",
    "  render(<Badge label='a' />);",
    '});'
  ),
  'apps/web/components/finch/card.tsx': lines(
    'export const Card = () => null;'
  ),
  'apps/web/components/finch/__tests__/card.visual.test.tsx': lines(
    "import { it } from 'vitest';",
    "import { Card } from '../card';",
    '',
    "it('renders', () => {",
    '  Card();',
    '});'
  ),
  'apps/web/lib/owl.ts': lines('export type Owl = { name: string };'),
  'apps/web/types/owl/index.ts': lines('export type Night = { owls: number };'),
  'apps/web/lib/consumer.ts': lines(
    "export { shout } from './kestrel/text';",
    "export type { Owl } from '@/lib/owl';",
    '',
    "export const later = () => import('./heron');"
  ),
  'apps/web/lib/wrap.ts': lines(
    "import { shout as yell, countryCount as count } from '@/lib/kestrel/text';",
    '',
    'export const both = () => [yell(String(count()))];'
  ),
  'apps/web/lib/__tests__/consumer.test.ts': lines(
    "import { it, vi } from 'vitest';",
    "import { sample } from '../kestrel/__tests__/fixtures';",
    '',
    "vi.mock('@/lib/kestrel/text');",
    "vi.doMock('../heron/actions');",
    '',
    "it('uses the sample', () => {",
    '  void sample;',
    '});'
  ),
  'apps/web/app/page.tsx': lines(
    "import { Badge } from '@/components/wren/badge';",
    "import { load } from '@/lib/heron';",
    '',
    'export default async function Page() {',
    "  await load('1');",
    "  return <Badge label='home' />;",
    '}'
  )
};

const git = (root: string, ...args: string[]) =>
  execFileSync(
    'git',
    [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.com',
      ...args
    ],
    { cwd: root, encoding: 'utf8' }
  );

export const writeFiles = (root: string, files: Record<string, string>) => {
  for (const [file, text] of Object.entries(files)) {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, text);
  }
};

export const createFixtureRepo = (files: Record<string, string> = FILES) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'move-packages-'));
  writeFiles(root, files);
  git(root, 'init', '--quiet', '--initial-branch=main');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--message', 'Fixture');
  return {
    root,
    read: (file: string) => fs.readFileSync(path.join(root, file), 'utf8'),
    readJson: <T = Record<string, unknown>>(file: string) =>
      JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as T,
    exists: (file: string) => fs.existsSync(path.join(root, file)),
    status: () => git(root, 'status', '--porcelain', '--untracked-files=all'),
    renames: () =>
      git(root, 'status', '--porcelain')
        .split('\n')
        .filter((line) => line.startsWith('R'))
        .map((line) => line.slice(3)),
    tree: () => {
      git(root, 'add', '--all');
      return git(root, 'write-tree').trim();
    },
    commit: (message: string) => {
      git(root, 'add', '--all');
      git(root, 'commit', '--quiet', '--message', message);
    },
    remove: () => fs.rmSync(root, { recursive: true, force: true })
  };
};

export type FixtureRepo = ReturnType<typeof createFixtureRepo>;
