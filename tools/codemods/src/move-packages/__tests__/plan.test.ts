import { describe, expect, it } from 'vitest';
import { exportKey, moduleId, packageNameOf, sortKeys } from '../plan';

describe('moduleId', () => {
  it('drops the code extension and index', () => {
    expect(moduleId('text.ts')).toBe('text');
    expect(moduleId('index.ts')).toBe('');
    expect(moduleId('schemas/index.tsx')).toBe('schemas');
    expect(moduleId('schemas/user.tsx')).toBe('schemas/user');
  });

  it('keeps the extension of data files', () => {
    expect(moduleId('countries.json')).toBe('countries.json');
  });
});

describe('exportKey', () => {
  it('maps the package root to .', () => {
    expect(exportKey('index.ts')).toBe('.');
    expect(exportKey('testing/fixtures.ts')).toBe('./testing/fixtures');
  });
});

describe('packageNameOf', () => {
  it('returns the npm package of a bare specifier', () => {
    expect(packageNameOf('next/navigation')).toBe('next');
    expect(packageNameOf('@prisma/client')).toBe('@prisma/client');
    expect(packageNameOf('@giveaway/util-types/widetype')).toBe(
      '@giveaway/util-types'
    );
  });

  it('skips relative paths, app aliases and Node built-ins', () => {
    expect(packageNameOf('./text')).toBeNull();
    expect(packageNameOf('@/lib/text')).toBeNull();
    expect(packageNameOf('node:fs')).toBeNull();
    expect(packageNameOf('path')).toBeNull();
  });
});

describe('sortKeys', () => {
  it('sorts by code point, the same in every locale', () => {
    expect(Object.keys(sortKeys({ b: 1, a: 2, B: 3, '@x': 4 }))).toEqual([
      '@x',
      'B',
      'a',
      'b'
    ]);
  });
});
