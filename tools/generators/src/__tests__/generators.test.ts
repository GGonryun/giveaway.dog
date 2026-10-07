import { logger, readJson, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  featureGenerator,
  modelGenerator,
  platformSlotGenerator,
  serverGenerator,
  uiGenerator,
  utilGenerator
} from '../generators.ts';

const NEXT_CONFIG = 'apps/web/next.config.ts';

const options = { skipFormat: true, skipInstall: true };

describe('package generators', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      NEXT_CONFIG,
      "const nextConfig = {\n  transpilePackages: ['@giveaway/alpha', '@giveaway/zulu']\n};\n"
    );
  });

  it('creates a model package with its tags, configs and a tested module', async () => {
    await modelGenerator(tree, {
      ...options,
      name: 'referrals-model',
      directory: 'participants'
    });

    const root = 'packages/participants/referrals-model';
    const manifest = readJson(tree, `${root}/package.json`);
    expect(manifest).toMatchObject({
      name: '@giveaway/referrals-model',
      nx: {
        tags: ['type:model', 'runtime:isomorphic', 'scope:participants'],
        targets: { lint: { executor: '@giveaway/eslint-config:lint' } }
      },
      exports: { './referrals-model': './src/referrals-model.ts' },
      scripts: {
        'type-check': 'tsc --noEmit',
        'test:unit': 'vitest run --project server',
        'test:server': 'vitest run --project server',
        'test:property': 'vitest run --project property --passWithNoTests'
      },
      dependencies: { zod: 'catalog:' }
    });
    expect(readJson(tree, `${root}/tsconfig.json`)).toEqual({
      extends: '@giveaway/tsconfig/library.json'
    });
    expect(tree.read(`${root}/vitest.config.ts`, 'utf-8')).toContain(
      'packageTestConfig()'
    );
    expect(tree.read(`${root}/src/referrals-model.ts`, 'utf-8')).toContain(
      'export const referralsModelSchema'
    );
    expect(tree.exists(`${root}/src/__tests__/referrals-model.test.ts`)).toBe(
      true
    );
  });

  it('adds the package to the transpiled packages of the app in order', async () => {
    await utilGenerator(tree, {
      ...options,
      name: 'util-maths',
      directory: 'shared'
    });

    expect(tree.read(NEXT_CONFIG, 'utf-8')).toContain(
      "transpilePackages: ['@giveaway/alpha', '@giveaway/util-maths', '@giveaway/zulu']"
    );
    expect(
      readJson(tree, 'packages/shared/util-maths/package.json').scripts
    ).toMatchObject({
      'test:property': 'vitest run --project property --passWithNoTests'
    });
  });

  it('creates a server package whose module imports server-only', async () => {
    await serverGenerator(tree, {
      ...options,
      name: 'billing-server',
      directory: 'billing',
      module: 'invoices'
    });

    const root = 'packages/billing/billing-server';
    expect(readJson(tree, `${root}/package.json`)).toMatchObject({
      nx: { tags: ['type:server', 'runtime:server', 'scope:billing'] },
      exports: { './invoices': './src/invoices.ts' },
      dependencies: { 'server-only': 'catalog:' }
    });
    expect(tree.read(`${root}/src/invoices.ts`, 'utf-8')).toMatch(
      /^import 'server-only';/
    );
    expect(readJson(tree, `${root}/package.json`).scripts).not.toHaveProperty(
      'test:property'
    );
  });

  it('creates ui and feature packages with React and the frontend tests', async () => {
    await uiGenerator(tree, { ...options, name: 'ui-badge', directory: 'ui' });
    await featureGenerator(tree, {
      ...options,
      name: 'billing-page',
      directory: 'billing'
    });

    const ui = readJson(tree, 'packages/ui/ui-badge/package.json');
    expect(ui).toMatchObject({
      nx: { tags: ['type:ui', 'runtime:react', 'scope:ui'] },
      exports: { './ui-badge': './src/ui-badge.tsx' },
      scripts: { 'test:frontend': 'vitest run --project frontend' },
      peerDependencies: { react: 'catalog:' },
      devDependencies: {
        '@giveaway/testing-dom': 'workspace:*',
        '@testing-library/react': 'catalog:'
      }
    });
    expect(ui.scripts).not.toHaveProperty('test:property');
    expect(readJson(tree, 'packages/ui/ui-badge/tsconfig.json')).toEqual({
      extends: '@giveaway/tsconfig/react-library.json'
    });
    expect(
      tree.read('packages/ui/ui-badge/src/ui-badge.tsx', 'utf-8')
    ).not.toContain("'use client'");
    expect(
      tree.read('packages/billing/billing-page/src/billing-page.tsx', 'utf-8')
    ).toMatch(/^'use client';/);
    expect(
      tree.exists(
        'packages/billing/billing-page/src/__tests__/billing-page.test.tsx'
      )
    ).toBe(true);
  });

  it('refuses a package that already exists', async () => {
    await modelGenerator(tree, {
      ...options,
      name: 'team-model',
      directory: 'team'
    });

    await expect(
      modelGenerator(tree, {
        ...options,
        name: 'team-model',
        directory: 'other'
      })
    ).rejects.toThrow('@giveaway/team-model already exists.');
  });

  it('refuses names that are not lowercase words separated by dashes', async () => {
    await expect(
      modelGenerator(tree, {
        ...options,
        name: '@giveaway/Team',
        directory: 'team'
      })
    ).rejects.toThrow('is not a valid package name');
    await expect(
      modelGenerator(tree, {
        ...options,
        name: 'team-model',
        directory: '../team'
      })
    ).rejects.toThrow('is not a valid directory');
  });
});

describe('platformSlotGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('creates the slot package in the folder of its platform', async () => {
    await platformSlotGenerator(tree, {
      ...options,
      platform: 'mastodon',
      slot: 'api'
    });

    expect(
      readJson(tree, 'packages/integrations/mastodon/mastodon-api/package.json')
    ).toMatchObject({
      name: '@giveaway/mastodon-api',
      nx: {
        tags: [
          'type:server',
          'runtime:server',
          'scope:integrations',
          'platform:mastodon'
        ]
      }
    });
  });

  it('gives each slot the type from the plugin table', async () => {
    await platformSlotGenerator(tree, {
      ...options,
      platform: 'mastodon',
      slot: 'task-entry'
    });

    expect(
      readJson(
        tree,
        'packages/integrations/mastodon/mastodon-task-entry/package.json'
      ).nx.tags
    ).toContain('type:feature');
  });

  it('names the registry that a task slot goes in', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});

    await platformSlotGenerator(tree, {
      ...options,
      platform: 'mastodon',
      slot: 'task-validation'
    });

    expect(info).toHaveBeenCalledWith(
      'Add @giveaway/mastodon-task-validation to the registry in @giveaway/task-validation, so the giveaway tasks use it.'
    );
  });

  it('refuses an unknown slot', async () => {
    await expect(
      platformSlotGenerator(tree, {
        ...options,
        platform: 'mastodon',
        slot: 'widgets' as 'api'
      })
    ).rejects.toThrow('"widgets" is not a platform slot.');
  });
});
