import { describe, expect, it } from 'vitest';
import {
  findAddedLines,
  isInRanges,
  parseChangedLines
} from '../changed-lines.ts';

const DIFF = [
  'diff --git a/packages/a/src/one.ts b/packages/a/src/one.ts',
  'index 1111111..2222222 100644',
  '--- a/packages/a/src/one.ts',
  '+++ b/packages/a/src/one.ts',
  '@@ -3 +3 @@ export const one = 1;',
  '-const old = 1;',
  '+const changed = 1;',
  '@@ -10,0 +11,3 @@ export const two = 2;',
  '+// Stryker disable next-line all: not reachable',
  '+const added = 2;',
  '+const more = 3;',
  '@@ -20,2 +23,0 @@',
  '-const removed = 1;',
  '-const gone = 2;',
  'diff --git a/packages/a/src/deleted.ts b/packages/a/src/deleted.ts',
  'deleted file mode 100644',
  '--- a/packages/a/src/deleted.ts',
  '+++ /dev/null',
  '@@ -1,2 +0,0 @@',
  '-export const x = 1;',
  '-export const y = 2;',
  'diff --git a/packages/b/src/new.ts b/packages/b/src/new.ts',
  'new file mode 100644',
  '--- /dev/null',
  '+++ b/packages/b/src/new.ts',
  '@@ -0,0 +1,2 @@',
  '+export const z = 1;',
  "+console.log('Stryker disable is only text here');"
].join('\n');

describe('parseChangedLines', () => {
  it('returns the added and modified line ranges of each file', () => {
    expect(parseChangedLines(DIFF)).toEqual(
      new Map([
        [
          'packages/a/src/one.ts',
          [
            { start: 3, end: 3 },
            { start: 11, end: 13 }
          ]
        ],
        ['packages/b/src/new.ts', [{ start: 1, end: 2 }]]
      ])
    );
  });

  it('skips deleted files', () => {
    expect(parseChangedLines(DIFF).has('packages/a/src/deleted.ts')).toBe(
      false
    );
  });

  it('returns no files for an empty diff', () => {
    expect(parseChangedLines('')).toEqual(new Map());
  });

  it('reads hunk headers with counts of several digits', () => {
    const diff = [
      '+++ b/packages/c/src/x.ts',
      '@@ -120,15 +130,12 @@ export const x = 1;'
    ].join('\n');

    expect(parseChangedLines(diff)).toEqual(
      new Map([['packages/c/src/x.ts', [{ start: 130, end: 141 }]]])
    );
  });

  it('only reads headers at the start of a line', () => {
    const diff = [
      '+++ b/packages/c/src/x.ts',
      '@@ -1 +1,2 @@',
      "+const text = '+++ b/packages/d/src/y.ts';",
      "+const hunk = '@@ -1 +50,5 @@';",
      '@@ -9 +9 @@',
      '+const z = 1;'
    ].join('\n');

    expect(parseChangedLines(diff)).toEqual(
      new Map([
        [
          'packages/c/src/x.ts',
          [
            { start: 1, end: 2 },
            { start: 9, end: 9 }
          ]
        ]
      ])
    );
  });

  it('ignores hunks before the first file header', () => {
    expect(parseChangedLines(['@@ -1 +1,2 @@', '+a', '+b'].join('\n'))).toEqual(
      new Map()
    );
  });

  it('reads a file path without the b/ prefix', () => {
    const diff = ['+++ packages/c/src/x.ts', '@@ -1 +1,2 @@', '+a', '+b'].join(
      '\n'
    );

    expect(parseChangedLines(diff)).toEqual(
      new Map([['packages/c/src/x.ts', [{ start: 1, end: 2 }]]])
    );
  });
});

describe('isInRanges', () => {
  const ranges = [
    { start: 3, end: 3 },
    { start: 11, end: 13 }
  ];

  it.each([3, 11, 12, 13])('includes line %i', (line) => {
    expect(isInRanges(line, ranges)).toBe(true);
  });

  it.each([2, 4, 10, 14])('excludes line %i', (line) => {
    expect(isInRanges(line, ranges)).toBe(false);
  });

  it('excludes every line when there are no ranges', () => {
    expect(isInRanges(1, [])).toBe(false);
  });
});

describe('findAddedLines', () => {
  it('returns the added lines that match, with their new line numbers', () => {
    expect(findAddedLines(DIFF, /Stryker disable/)).toEqual([
      {
        file: 'packages/a/src/one.ts',
        line: 11,
        text: '// Stryker disable next-line all: not reachable'
      },
      {
        file: 'packages/b/src/new.ts',
        line: 2,
        text: "console.log('Stryker disable is only text here');"
      }
    ]);
  });

  it('does not count removed lines', () => {
    const diff = [
      '+++ b/packages/a/src/one.ts',
      '@@ -4,2 +4 @@',
      '-const old = 1;',
      '-const older = 2;',
      '+    // Stryker disable next-line all: reason   '
    ].join('\n');

    expect(findAddedLines(diff, /Stryker disable/)).toEqual([
      {
        file: 'packages/a/src/one.ts',
        line: 4,
        text: '// Stryker disable next-line all: reason'
      }
    ]);
  });

  it('ignores lines before the first file header', () => {
    expect(
      findAddedLines(
        ['@@ -1 +1 @@', '+// Stryker disable all'].join('\n'),
        /Stryker disable/
      )
    ).toEqual([]);
  });

  it('ignores removed lines that match', () => {
    const diff = [
      '+++ b/packages/a/src/one.ts',
      '@@ -1 +1 @@',
      '-// Stryker disable next-line all: old',
      '+const x = 1;'
    ].join('\n');

    expect(findAddedLines(diff, /Stryker disable/)).toEqual([]);
  });

  it('counts context lines when the diff has them', () => {
    const diff = [
      '+++ b/packages/a/src/one.ts',
      '@@ -5,2 +5,3 @@',
      ' const a = 1;',
      ' const b = 2;',
      '+// Stryker disable next-line all: reason'
    ].join('\n');

    expect(findAddedLines(diff, /Stryker disable/)).toEqual([
      {
        file: 'packages/a/src/one.ts',
        line: 7,
        text: '// Stryker disable next-line all: reason'
      }
    ]);
  });
});
