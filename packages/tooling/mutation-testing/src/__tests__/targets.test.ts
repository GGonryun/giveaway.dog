import { describe, expect, it } from 'vitest';
import {
  isMutableFile,
  packageDirOf,
  toMutatePatterns,
  toPackageTargets
} from '../targets.ts';

describe('isMutableFile', () => {
  it.each([
    'packages/winners/winners-server/src/selection.ts',
    'packages/winners/winners-server/src/procedures/roll-prize.ts',
    'packages/integrations/x/x-api/src/client.ts'
  ])('accepts the source file %s', (file) => {
    expect(isMutableFile(file)).toBe(true);
  });

  it.each([
    [
      'a test',
      'packages/winners/winners-server/src/__tests__/selection.test.ts'
    ],
    ['a fixture', 'packages/winners/winners-server/src/testing/fixtures.ts'],
    ['a declaration file', 'packages/ui/ui-utils/src/assets.d.ts'],
    ['a component', 'packages/ui/ui-primitives/src/button.tsx'],
    ['a tooling package', 'packages/tooling/vitest-config/src/projects.ts'],
    ['a file outside src', 'packages/winners/winners-server/vitest.config.ts'],
    ['the app', 'apps/web/middleware.ts'],
    ['a generator', 'tools/generators/src/index.ts'],
    ['a path that only contains packages/', 'docs/packages/a/src/b.ts']
  ])('rejects %s', (_label, file) => {
    expect(isMutableFile(file)).toBe(false);
  });
});

describe('packageDirOf', () => {
  it('returns the folder that holds src', () => {
    expect(
      packageDirOf('packages/winners/winners-server/src/procedures/x.ts')
    ).toBe('packages/winners/winners-server');
  });

  it('uses the last src folder of the path', () => {
    expect(packageDirOf('packages/a/src/b/src/c.ts')).toBe('packages/a/src/b');
  });
});

describe('toPackageTargets', () => {
  it('groups the mutable files by package with paths relative to the package', () => {
    const targets = toPackageTargets(
      new Map([
        ['packages/z/z-server/src/b.ts', [{ start: 1, end: 2 }]],
        ['packages/a/a-model/src/x.ts', [{ start: 5, end: 5 }]],
        ['packages/z/z-server/src/c/d.ts', [{ start: 7, end: 9 }]],
        ['packages/z/z-server/src/__tests__/b.test.ts', [{ start: 1, end: 1 }]],
        ['README.md', [{ start: 1, end: 1 }]]
      ])
    );

    expect(targets).toEqual([
      {
        packageDir: 'packages/a/a-model',
        files: new Map([['src/x.ts', [{ start: 5, end: 5 }]]])
      },
      {
        packageDir: 'packages/z/z-server',
        files: new Map([
          ['src/b.ts', [{ start: 1, end: 2 }]],
          ['src/c/d.ts', [{ start: 7, end: 9 }]]
        ])
      }
    ]);
  });

  it('returns no targets when nothing mutable changed', () => {
    expect(
      toPackageTargets(new Map([['docs/a.md', [{ start: 1, end: 1 }]]]))
    ).toEqual([]);
  });
});

describe('toMutatePatterns', () => {
  it('writes one Stryker line range per changed range', () => {
    expect(
      toMutatePatterns(
        new Map([
          [
            'src/b.ts',
            [
              { start: 1, end: 2 },
              { start: 10, end: 10 }
            ]
          ],
          ['src/c.ts', [{ start: 4, end: 6 }]]
        ])
      )
    ).toEqual(['src/b.ts:1-2', 'src/b.ts:10-10', 'src/c.ts:4-6']);
  });
});
