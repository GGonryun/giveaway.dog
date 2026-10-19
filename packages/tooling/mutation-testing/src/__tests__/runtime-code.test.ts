import { describe, expect, it } from 'vitest';
import { hasRuntimeCode } from '../runtime-code.ts';

describe('hasRuntimeCode', () => {
  it.each([
    ['type aliases', 'export type A = string;\nexport type B = { a: A };'],
    ['an interface', 'export interface A {\n  a: string;\n}'],
    [
      'a type import and a comment',
      "import type { A } from './a';\n// TODO: narrow it.\nexport type B = A[];"
    ],
    [
      'an import used only as a type',
      "import { A } from './a';\nexport type B = A;"
    ],
    ['a type re-export', "export type { A } from './a';"],
    [
      'a declared constant',
      'declare const a: string;\nexport type A = typeof a;'
    ],
    ['nothing', '']
  ])('is false for %s', (_, source) => {
    expect(hasRuntimeCode(source)).toBe(false);
  });

  it.each([
    ['a constant', "export const A = 'a';"],
    ['a function', 'export const f = (a: number): number => a + 1;'],
    ['an enum', 'export enum A {\n  B\n}'],
    ['a value re-export', "export { a } from './a';"],
    ['a side-effect import', "import './a';"],
    [
      'a constant next to types',
      'export type A = string;\nexport const B: A = "b";'
    ]
  ])('is true for %s', (_, source) => {
    expect(hasRuntimeCode(source)).toBe(true);
  });
});
