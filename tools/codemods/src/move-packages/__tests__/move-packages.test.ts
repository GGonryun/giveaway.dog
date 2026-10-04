import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { movePackages } from '../move-packages';
import { MoveError } from '../plan';
import { createFixtureRepo, writeFiles } from './fixture-repo';
import type { FixtureRepo } from './fixture-repo';

const BATCH = [
  '@giveaway/kestrel-text',
  '@giveaway/heron-store',
  '@giveaway/wren-ui',
  '@giveaway/db-client',
  '@giveaway/db-model'
];

const KESTREL = 'packages/birds/kestrel-text';
const HERON = 'packages/birds/heron-store';
const WREN = 'packages/birds/wren-ui';

type Manifest = {
  exports: Record<string, string>;
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  nx: { tags: string[]; targets: { lint: { command: string } } };
};

const move = (repo: FixtureRepo, packages: string[], renames = {}) =>
  movePackages({ root: repo.root, packages, renames, install: false });

const problemsOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof MoveError) return error.problems;
    throw error;
  }
  throw new Error('expected a MoveError');
};

describe('movePackages', { timeout: 60_000 }, () => {
  let repo: FixtureRepo;

  beforeAll(async () => {
    repo = createFixtureRepo();
    await move(repo, BATCH);
  });

  afterAll(() => repo.remove());

  describe('moving files', () => {
    it('moves file sources, data files, tests and snapshots with git mv', () => {
      expect(repo.renames()).toEqual(
        expect.arrayContaining([
          `apps/web/lib/kestrel/text.ts -> ${KESTREL}/src/text.ts`,
          `apps/web/lib/kestrel/countries.json -> ${KESTREL}/src/countries.json`,
          `apps/web/lib/kestrel/__tests__/text.test.ts -> ${KESTREL}/src/__tests__/text.test.ts`,
          `apps/web/lib/kestrel/__tests__/__snapshots__/text.snapshot.test.tsx.snap -> ${KESTREL}/src/__tests__/__snapshots__/text.snapshot.test.tsx.snap`,
          `apps/web/components/wren/badge.tsx -> ${WREN}/src/badge.tsx`,
          `apps/web/components/wren/__tests__/badge.test.tsx -> ${WREN}/src/__tests__/badge.test.tsx`
        ])
      );
    });

    it('flattens a single folder source into src', () => {
      expect(repo.exists(`${HERON}/src/index.ts`)).toBe(true);
      expect(repo.exists(`${HERON}/src/actions.ts`)).toBe(true);
      expect(repo.exists(`${HERON}/src/__tests__/index.test.ts`)).toBe(true);
    });

    it('moves shared test fixtures to the testing entry point', () => {
      expect(repo.exists(`${KESTREL}/src/testing/fixtures.ts`)).toBe(true);
      expect(
        repo.readJson<Manifest>(`${KESTREL}/package.json`).exports
      ).toEqual({
        './countries.json': './src/countries.json',
        './testing/fixtures': './src/testing/fixtures.ts',
        './text': './src/text.ts'
      });
    });

    it('leaves the files of other packages and removes empty folders', () => {
      expect(repo.exists('apps/web/lib/kestrel/other.ts')).toBe(true);
      expect(repo.exists('apps/web/lib/heron')).toBe(false);
      expect(repo.exists('apps/web/components/wren')).toBe(false);
    });
  });

  describe('rewriting imports', () => {
    it('rewrites aliases, relative paths, re-exports and import() in the app', () => {
      expect(repo.read('apps/web/lib/consumer.ts')).toBe(
        [
          "export { shout } from '@giveaway/kestrel-text/text';",
          "export type { Owl } from '@/lib/owl';",
          '',
          "export const later = () => import('@giveaway/heron-store');",
          ''
        ].join('\n')
      );
      expect(repo.read('apps/web/lib/kestrel/other.ts')).toContain(
        "{ shout } from '@giveaway/kestrel-text/text'"
      );
      expect(repo.read('apps/web/app/page.tsx')).toContain(
        "{ load } from '@giveaway/heron-store'"
      );
    });

    it('rewrites vi.mock and vi.doMock, and the fixture imports of other tests', () => {
      const test = repo.read('apps/web/lib/__tests__/consumer.test.ts');

      expect(test).toContain("vi.mock('@giveaway/kestrel-text/text');");
      expect(test).toContain("vi.doMock('@giveaway/heron-store/actions');");
      expect(test).toContain(
        "{ sample } from '@giveaway/kestrel-text/testing/fixtures'"
      );
    });

    it('uses relative imports inside a package', () => {
      const test = repo.read(`${HERON}/src/__tests__/index.test.ts`);

      expect(test).toContain("{ load } from '..'");
      expect(test).toContain("vi.mock('../actions'");
      expect(test).toContain("typeof import('../actions')");
      expect(test).toContain("vi.importActual<Actions>('../actions')");
      expect(repo.read(`${KESTREL}/src/__tests__/text.test.ts`)).toContain(
        "{ sample } from '../testing/fixtures'"
      );
      expect(
        repo.read(`${KESTREL}/src/__tests__/text.snapshot.test.tsx`)
      ).toContain("{ shout } from '../text'");
    });

    it('rewrites the imports of other workspace packages and declares the dependency', () => {
      expect(
        repo.read('packages/tooling/testing-server/src/setup.ts')
      ).toContain("vi.mock('@giveaway/db-client/prisma'");
      expect(
        repo.readJson<Manifest>('packages/tooling/testing-server/package.json')
          .devDependencies
      ).toEqual({
        '@giveaway/db-client': 'workspace:*',
        typescript: 'catalog:'
      });
    });

    it('rewrites @prisma/client to @giveaway/db-model, except in db-client', () => {
      expect(repo.read(`${HERON}/src/index.ts`)).toContain(
        "{ User } from '@giveaway/db-model'"
      );
      expect(repo.read('packages/infra/db-client/src/prisma.ts')).toContain(
        "{ PrismaClient } from '@prisma/client'"
      );
    });

    it('rewrites import types in declaration files', () => {
      expect(repo.read('apps/web/types/globals.d.ts')).toBe(
        "declare type Shout = typeof import('@giveaway/kestrel-text/text').shout;\n"
      );
    });

    it('formats the changed files with Prettier', () => {
      expect(repo.read('apps/web/lib/wrap.ts')).toBe(
        [
          'import {',
          '  shout as yell,',
          '  countryCount as count',
          "} from '@giveaway/kestrel-text/text';",
          '',
          'export const both = () => [yell(String(count()))];',
          ''
        ].join('\n')
      );
    });
  });

  describe('server-only', () => {
    it('adds it to each module of a server package', () => {
      expect(repo.read(`${HERON}/src/index.ts`)).toMatch(
        /^import 'server-only';\n\nimport \{ User \}/
      );
    });

    it('adds it after the directives of a module', () => {
      expect(repo.read(`${HERON}/src/cached.ts`)).toBe(
        [
          "'use cache';",
          '',
          "import 'server-only';",
          '',
          'export const cached = async () => 1;',
          ''
        ].join('\n')
      );
    });

    it("skips 'use server' modules, tests and modules that already have it", () => {
      expect(repo.read(`${HERON}/src/actions.ts`)).not.toContain('server-only');
      expect(repo.read(`${HERON}/src/__tests__/index.test.ts`)).not.toContain(
        'server-only'
      );
      expect(
        repo
          .read('packages/infra/db-client/src/prisma.ts')
          .match(/server-only/g)
      ).toHaveLength(1);
    });

    it('skips declaration files', () => {
      expect(repo.read(`${HERON}/src/env.d.ts`)).toBe(
        'declare const HERON_ENV: string;\n'
      );
    });

    it('skips packages that are not server packages', () => {
      expect(repo.read(`${KESTREL}/src/text.ts`)).not.toContain('server-only');
    });
  });

  describe('package files', () => {
    it('writes package.json with the tags, exports, scripts and dependencies', () => {
      expect(repo.readJson(`${HERON}/package.json`)).toEqual({
        name: '@giveaway/heron-store',
        private: true,
        type: 'module',
        nx: {
          tags: ['type:server', 'runtime:server', 'scope:birds'],
          targets: {
            lint: {
              command: `eslint ${HERON} --suppressions-location ${HERON}/eslint-suppressions.json`,
              options: { cwd: '{workspaceRoot}' },
              cache: true
            }
          }
        },
        exports: {
          '.': './src/index.ts',
          './actions': './src/actions.ts',
          './cached': './src/cached.ts'
        },
        scripts: {
          'type-check': 'tsc --noEmit',
          test: 'vitest run',
          'test:unit': 'vitest run --project server',
          'test:server': 'vitest run --project server'
        },
        dependencies: {
          '@giveaway/db-client': 'workspace:*',
          '@giveaway/db-model': 'workspace:*',
          '@giveaway/kestrel-text': 'workspace:*',
          'server-only': 'catalog:'
        },
        devDependencies: {
          '@giveaway/eslint-config': 'workspace:*',
          '@giveaway/testing-server': 'workspace:*',
          '@giveaway/tsconfig': 'workspace:*',
          '@giveaway/vitest-config': 'workspace:*',
          '@types/node': 'catalog:',
          typescript: 'catalog:',
          vitest: 'catalog:'
        }
      });
    });

    it('declares react as a peer and adds the DOM test setup for component tests', () => {
      const manifest = repo.readJson<Manifest>(`${WREN}/package.json`);

      expect(manifest.peerDependencies).toEqual({ react: 'catalog:' });
      expect(manifest.dependencies).toEqual({
        '@giveaway/kestrel-text': 'workspace:*'
      });
      expect(manifest.devDependencies).toMatchObject({
        '@giveaway/testing-dom': 'workspace:*',
        '@testing-library/react': 'catalog:',
        '@types/react': 'catalog:'
      });
      expect(manifest.scripts).toEqual({
        'type-check': 'tsc --noEmit',
        test: 'vitest run',
        'test:unit': 'vitest run --project frontend',
        'test:frontend': 'vitest run --project frontend'
      });
    });

    it('declares the imports of shared test fixtures as devDependencies', () => {
      const manifest = repo.readJson<Manifest>(`${KESTREL}/package.json`);

      expect(repo.read(`${KESTREL}/src/testing/fixtures.ts`)).toContain(
        "import type { User } from '@giveaway/db-model';"
      );
      expect(manifest.dependencies).toBeUndefined();
      expect(manifest.devDependencies).toMatchObject({
        '@giveaway/db-model': 'workspace:*'
      });
    });

    it('writes the server and snapshot scripts for a package with both', () => {
      expect(
        repo.readJson<Manifest>(`${KESTREL}/package.json`).scripts
      ).toEqual({
        'type-check': 'tsc --noEmit',
        test: 'vitest run',
        'test:unit': 'vitest run --project server',
        'test:server': 'vitest run --project server',
        'test:snapshot': 'vitest run --project snapshot'
      });
    });

    it('lets a package with no tests pass', () => {
      expect(
        repo.readJson<Manifest>('packages/infra/db-model/package.json').scripts
      ).toEqual({
        'type-check': 'tsc --noEmit',
        test: 'vitest run --passWithNoTests'
      });
    });

    it('writes tsconfig.json with the preset for the package', () => {
      expect(repo.readJson('packages/infra/db-client/tsconfig.json')).toEqual({
        extends: '@giveaway/tsconfig/library.json'
      });
      expect(repo.readJson(`${KESTREL}/tsconfig.json`)).toEqual({
        extends: '@giveaway/tsconfig/react-library.json'
      });
      expect(repo.readJson(`${WREN}/tsconfig.json`)).toEqual({
        extends: '@giveaway/tsconfig/react-library.json'
      });
    });

    it('writes vitest.config.ts with the shared projects', () => {
      expect(repo.read(`${KESTREL}/vitest.config.ts`)).toContain(
        'export default defineConfig(packageTestConfig());'
      );
    });
  });

  describe('repository files', () => {
    it('moves the suppressions of moved files to the package', () => {
      expect(repo.read(`${HERON}/eslint-suppressions.json`)).toBe(
        JSON.stringify(
          {
            [`${HERON}/src/index.ts`]: {
              '@typescript-eslint/no-explicit-any': { count: 2 }
            }
          },
          null,
          2
        )
      );
      expect(repo.readJson('eslint-suppressions.json')).toEqual({
        'apps/web/lib/consumer.ts': {
          '@typescript-eslint/no-explicit-any': { count: 1 }
        }
      });
    });

    it('writes no suppressions file for a package with no entries', () => {
      expect(repo.exists(`${KESTREL}/eslint-suppressions.json`)).toBe(false);
      expect(
        repo.readJson<Manifest>(`${KESTREL}/package.json`).nx.targets.lint
          .command
      ).toBe(`eslint ${KESTREL}`);
    });

    it('adds the packages to transpilePackages and the app dependencies', () => {
      expect(repo.read('apps/web/next.config.ts')).toContain(
        [
          '  transpilePackages: [',
          "    '@giveaway/db-client',",
          "    '@giveaway/db-model',",
          "    '@giveaway/heron-store',",
          "    '@giveaway/kestrel-text',",
          "    '@giveaway/util-errors',",
          "    '@giveaway/wren-ui'",
          '  ],'
        ].join('\n')
      );
      expect(
        Object.keys(
          repo.readJson<Manifest>('apps/web/package.json').dependencies ?? {}
        )
      ).toEqual([
        '@giveaway/db-client',
        '@giveaway/db-model',
        '@giveaway/heron-store',
        '@giveaway/kestrel-text',
        '@giveaway/util-errors',
        '@giveaway/wren-ui',
        'next',
        'react'
      ]);
    });

    it('empties the sources of moved packages in the package map', () => {
      const map = repo.readJson<{
        testFixtures: Record<string, unknown>;
        packages: {
          name: string;
          sources: string[];
          dependsOn: string[];
          npm: string[];
        }[];
      }>('docs/monorepo/package-map.json');
      const heron = map.packages.find(
        (pkg) => pkg.name === '@giveaway/heron-store'
      );

      expect(heron).toMatchObject({
        sources: [],
        dependsOn: [
          '@giveaway/db-client',
          '@giveaway/db-model',
          '@giveaway/kestrel-text'
        ],
        npm: []
      });
      expect(map.testFixtures).toEqual({});
      expect(
        map.packages.find((pkg) => pkg.name === '@giveaway/owl-types')?.sources
      ).toEqual(['lib/owl.ts', 'types/owl/index.ts']);
    });
  });
});

describe('movePackages on a newer main', { timeout: 60_000 }, () => {
  it('gives the same result when it runs again', async () => {
    const first = createFixtureRepo();
    const second = createFixtureRepo();
    try {
      await move(first, BATCH);
      await move(second, [...BATCH].reverse());

      expect(second.tree()).toBe(first.tree());
    } finally {
      first.remove();
      second.remove();
    }
  });

  it('also rewrites the imports that feature work added', async () => {
    const repo = createFixtureRepo();
    try {
      writeFiles(repo.root, {
        'apps/web/lib/feature.ts':
          "export { shout } from '@/lib/kestrel/text';\n"
      });
      repo.commit('Feature work');
      await move(repo, BATCH);

      expect(repo.read('apps/web/lib/feature.ts')).toBe(
        "export { shout } from '@giveaway/kestrel-text/text';\n"
      );
    } finally {
      repo.remove();
    }
  });
});

describe('movePackages checks', { timeout: 60_000 }, () => {
  let repo: FixtureRepo;

  beforeAll(() => {
    repo = createFixtureRepo();
  });

  afterAll(() => repo.remove());

  it('stops on two sources with the same module name', async () => {
    expect(await problemsOf(move(repo, ['@giveaway/owl-types']))).toEqual(
      expect.arrayContaining([
        '@giveaway/owl-types/owl is the module name of apps/web/lib/owl.ts and apps/web/types/owl/index.ts. Rename one with --rename <source>=<name>'
      ])
    );
    expect(repo.status()).toBe('');
  });

  it('stops on a package that imports a file that stays in the app', async () => {
    expect(await problemsOf(move(repo, ['@giveaway/heron-store']))).toEqual([
      '@giveaway/heron-store: apps/web/lib/heron/index.ts imports apps/web/lib/kestrel/text.ts, which stays in apps/web',
      '@giveaway/heron-store: apps/web/lib/heron/index.ts imports apps/web/lib/prisma.ts, which stays in apps/web'
    ]);
  });

  it('moves visual tests with their screenshots and writes the visual config', async () => {
    const visual = createFixtureRepo();
    const FINCH = 'packages/birds/finch-ui';
    try {
      await move(visual, ['@giveaway/finch-ui']);

      expect(
        visual.read(`${FINCH}/src/__tests__/card.visual.test.tsx`)
      ).toContain("{ Card } from '../card'");
      expect(
        visual.exists(
          `${FINCH}/src/__tests__/__screenshots__/card.visual.test.tsx/renders-1.png`
        )
      ).toBe(true);
      expect(visual.read(`${FINCH}/vitest.visual.config.ts`)).toBe(
        [
          "import { defineConfig } from 'vitest/config';",
          "import { visualTestConfig } from '@giveaway/testing-visual/config';",
          '',
          'export default defineConfig(visualTestConfig());',
          ''
        ].join('\n')
      );
      const manifest = visual.readJson<Manifest>(`${FINCH}/package.json`);
      expect(manifest.scripts).toEqual({
        'type-check': 'tsc --noEmit',
        test: 'vitest run --passWithNoTests',
        'test:visual': 'vitest run --config vitest.visual.config.ts',
        'test:visual:update':
          'vitest run --config vitest.visual.config.ts --update',
        'test:visual:docker': 'visual-docker',
        'test:visual:docker:update': 'visual-docker --update'
      });
      expect(manifest.devDependencies).toMatchObject({
        '@giveaway/testing-visual': 'workspace:*'
      });
      expect(manifest.devDependencies).not.toHaveProperty(
        '@giveaway/testing-dom'
      );
    } finally {
      visual.remove();
    }
  });

  it('stops on a package that is not in the map', async () => {
    expect(await problemsOf(move(repo, ['@giveaway/missing']))).toEqual([
      '@giveaway/missing is not in the package map'
    ]);
  });

  it('stops on a rename that matches no source', async () => {
    expect(
      await problemsOf(
        move(repo, ['@giveaway/kestrel-text'], { 'lib/nothing.ts': 'x.ts' })
      )
    ).toEqual([
      '--rename lib/nothing.ts: no source or fixture of these packages'
    ]);
  });

  it('moves the sources with the names from --rename', async () => {
    const renamed = createFixtureRepo();
    try {
      await move(renamed, ['@giveaway/owl-types'], {
        'types/owl/index.ts': 'night.ts'
      });

      expect(
        renamed.readJson<Manifest>('packages/birds/owl-types/package.json')
          .exports
      ).toEqual({ './night': './src/night.ts', './owl': './src/owl.ts' });
      expect(renamed.read('apps/web/lib/consumer.ts')).toContain(
        "export type { Owl } from '@giveaway/owl-types/owl';"
      );
    } finally {
      renamed.remove();
    }
  });

  it('keeps the extension of the source when --rename has none', async () => {
    const renamed = createFixtureRepo();
    try {
      await move(renamed, ['@giveaway/owl-types'], {
        'types/owl/index.ts': 'night'
      });

      expect(
        renamed.readJson<Manifest>('packages/birds/owl-types/package.json')
          .exports
      ).toEqual({ './night': './src/night.ts', './owl': './src/owl.ts' });
    } finally {
      renamed.remove();
    }
  });

  it('stops on a package that has already moved', async () => {
    const moved = createFixtureRepo();
    try {
      await move(moved, ['@giveaway/kestrel-text']);

      expect(await problemsOf(move(moved, ['@giveaway/kestrel-text']))).toEqual(
        ['@giveaway/kestrel-text is already in packages/birds/kestrel-text']
      );
    } finally {
      moved.remove();
    }
  });
});
