import { describe, expect, it } from 'vitest';
import { applyEdits, parseModule } from '../specifiers';

const valuesOf = (file: string, text: string) =>
  parseModule(file, text).specifiers.map((specifier) => [
    specifier.value,
    specifier.mockOnly
  ]);

describe('parseModule', () => {
  it('finds every kind of module specifier', () => {
    const text = [
      "import a from './a';",
      "import type { B } from './b';",
      "import './c';",
      "export { d } from './d';",
      "export * from './e';",
      "const f = await import('./f');",
      "const g = require('./g');",
      "vi.mock('./h', () => ({}));",
      "vi.doMock('./i');",
      "vi.unmock('./j');",
      "const k = await vi.importActual<typeof import('./k')>('./l');",
      "const m = await vi.importMock('./m');"
    ].join('\n');

    expect(valuesOf('lib/a.ts', text)).toEqual([
      ['./a', false],
      ['./b', false],
      ['./c', false],
      ['./d', false],
      ['./e', false],
      ['./f', false],
      ['./g', false],
      ['./h', true],
      ['./i', true],
      ['./j', true],
      ['./k', false],
      ['./l', false],
      ['./m', false]
    ]);
  });

  it('ignores strings that are not module specifiers', () => {
    const text = [
      "const path = './a';",
      "vi.fn('./b');",
      "other.mock('./c');",
      'const d = import(`./${name}`);'
    ].join('\n');

    expect(valuesOf('lib/a.ts', text)).toEqual([]);
  });

  it('parses JSX', () => {
    expect(
      valuesOf(
        'components/a.tsx',
        "import { B } from './b';\nexport const A = () => <B />;"
      )
    ).toEqual([['./b', false]]);
  });

  it('returns the directive prologue', () => {
    const { directives } = parseModule(
      'lib/a.ts',
      "'use cache';\n'use strict';\nimport a from './a';\n'not a directive';"
    );

    expect(directives.map((directive) => directive.value)).toEqual([
      'use cache',
      'use strict'
    ]);
  });
});

describe('applyEdits', () => {
  it('replaces the ranges from the end of the text', () => {
    const text = "import a from './a';\nimport b from './b';";
    const [a, b] = parseModule('lib/x.ts', text).specifiers;

    expect(
      applyEdits(text, [
        { start: a.start, end: a.end, text: '@giveaway/a' },
        { start: b.start, end: b.end, text: '../b' }
      ])
    ).toBe("import a from '@giveaway/a';\nimport b from '../b';");
  });
});
