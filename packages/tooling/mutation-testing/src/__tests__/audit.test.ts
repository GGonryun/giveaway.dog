import { describe, expect, it } from 'vitest';
import {
  auditIssueTitle,
  fileScores,
  formatAuditReport,
  MAX_LISTED_SURVIVORS,
  scoreOf,
  totalScore
} from '../audit.ts';
import type { MutantOutcome } from '../gate.ts';

const mutant = (overrides: Partial<MutantOutcome> = {}): MutantOutcome => ({
  fileName: 'src/a.ts',
  line: 1,
  column: 3,
  endLine: 1,
  mutatorName: 'BooleanLiteral',
  replacement: 'false',
  status: 'Killed',
  ...overrides
});

describe('scoreOf', () => {
  it('returns the share of mutants killed as a percentage', () => {
    expect(scoreOf({ killed: 3, survived: 1, noCoverage: 0 })).toBe(75);
  });

  it('counts uncovered mutants against the score', () => {
    expect(scoreOf({ killed: 1, survived: 0, noCoverage: 1 })).toBe(50);
  });

  it('returns null when there is nothing to score', () => {
    expect(scoreOf({ killed: 0, survived: 0, noCoverage: 0 })).toBeNull();
  });
});

describe('fileScores', () => {
  it('counts the outcomes of each file, sorted by file name', () => {
    expect(
      fileScores([
        mutant({ fileName: 'src/b.ts', status: 'Survived' }),
        mutant({ status: 'Killed' }),
        mutant({ status: 'Timeout' }),
        mutant({ status: 'NoCoverage' }),
        mutant({ status: 'Ignored' }),
        mutant({ fileName: 'src/b.ts', status: 'Killed' })
      ])
    ).toEqual([
      { fileName: 'src/a.ts', killed: 2, survived: 0, noCoverage: 1 },
      { fileName: 'src/b.ts', killed: 1, survived: 1, noCoverage: 0 }
    ]);
  });
});

describe('totalScore', () => {
  it('adds the counts of every file', () => {
    expect(
      totalScore([
        { fileName: 'src/a.ts', killed: 2, survived: 0, noCoverage: 1 },
        { fileName: 'src/b.ts', killed: 1, survived: 4, noCoverage: 2 }
      ])
    ).toEqual({ killed: 3, survived: 4, noCoverage: 3 });
  });
});

describe('auditIssueTitle', () => {
  it('names the package', () => {
    expect(auditIssueTitle('@giveaway/x-server')).toBe(
      'Mutation audit: @giveaway/x-server'
    );
  });
});

describe('formatAuditReport', () => {
  it('reports the scores and the survivors sorted by location', () => {
    expect(
      formatAuditReport({
        packageName: '@giveaway/x-server',
        packageDir: 'packages/x/x-server',
        runUrl: 'https://github.com/o/r/actions/runs/1',
        mutants: [
          mutant({ fileName: 'src/b.ts', line: 9, status: 'NoCoverage' }),
          mutant({ line: 7, status: 'Survived' }),
          mutant({ line: 2 }),
          mutant({ line: 3 })
        ]
      })
    ).toBe(
      [
        '## Mutation audit: @giveaway/x-server',
        '',
        'Package: `packages/x/x-server`. Mutation score: **50.0%** (2 killed, 1 survived, 1 not covered).',
        '',
        'Run and HTML report: https://github.com/o/r/actions/runs/1',
        '',
        '| File | Score | Killed | Survived | Not covered |',
        '| --- | --- | --- | --- | --- |',
        '| `src/a.ts` | 66.7% | 2 | 1 | 0 |',
        '| `src/b.ts` | 0.0% | 0 | 0 | 1 |',
        '',
        '### Survivors',
        '',
        'For each one, add or strengthen a test that kills it, or change the code so the mutant cannot exist. See "Mutation tests" in `CLAUDE.md`.',
        '',
        '| Location | Mutator | Replacement | Status |',
        '| --- | --- | --- | --- |',
        '| `src/a.ts:7` | BooleanLiteral | `false` | Survived |',
        '| `src/b.ts:9` | BooleanLiteral | `false` | NoCoverage |',
        ''
      ].join('\n')
    );
  });

  it('says no mutant survived and leaves out the run link when there is none', () => {
    const report = formatAuditReport({
      packageName: '@giveaway/x-model',
      packageDir: 'packages/x/x-model',
      mutants: [mutant()]
    });

    expect(report).toBe(
      [
        '## Mutation audit: @giveaway/x-model',
        '',
        'Package: `packages/x/x-model`. Mutation score: **100.0%** (1 killed, 0 survived, 0 not covered).',
        '',
        '| File | Score | Killed | Survived | Not covered |',
        '| --- | --- | --- | --- | --- |',
        '| `src/a.ts` | 100.0% | 1 | 0 | 0 |',
        '',
        'No mutant survived.',
        ''
      ].join('\n')
    );
  });

  it('writes n/a when there is nothing to score', () => {
    expect(
      formatAuditReport({
        packageName: '@giveaway/x-model',
        packageDir: 'packages/x/x-model',
        mutants: []
      })
    ).toContain('Mutation score: **n/a**');
  });

  it(`lists at most ${MAX_LISTED_SURVIVORS} survivors and counts the rest`, () => {
    const report = formatAuditReport({
      packageName: '@giveaway/x-server',
      packageDir: 'packages/x/x-server',
      mutants: Array.from({ length: MAX_LISTED_SURVIVORS + 2 }, (_, index) =>
        mutant({ line: index + 1, status: 'Survived' })
      )
    });

    expect(report).toContain(`| \`src/a.ts:${MAX_LISTED_SURVIVORS}\` |`);
    expect(report).not.toContain(
      `| \`src/a.ts:${MAX_LISTED_SURVIVORS + 1}\` |`
    );
    expect(
      report.endsWith(
        `| \`src/a.ts:${MAX_LISTED_SURVIVORS}\` | BooleanLiteral | \`false\` | Survived |\n\n2 more are in the HTML report.\n`
      )
    ).toBe(true);
  });

  it(`lists exactly ${MAX_LISTED_SURVIVORS} survivors without a remainder line`, () => {
    const report = formatAuditReport({
      packageName: '@giveaway/x-server',
      packageDir: 'packages/x/x-server',
      mutants: Array.from({ length: MAX_LISTED_SURVIVORS }, (_, index) =>
        mutant({ line: index + 1, status: 'Survived' })
      )
    });

    expect(
      report.endsWith(
        `| \`src/a.ts:${MAX_LISTED_SURVIVORS}\` | BooleanLiteral | \`false\` | Survived |\n`
      )
    ).toBe(true);
  });
});
