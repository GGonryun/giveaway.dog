import { describe, expect, it } from 'vitest';
import {
  DISABLE_COMMENT,
  evaluateGate,
  formatGateSummary,
  formatMutant,
  gatePasses,
  type GateReport,
  type MutantOutcome
} from '../gate.ts';

const mutant = (overrides: Partial<MutantOutcome> = {}): MutantOutcome => ({
  fileName: 'src/a.ts',
  line: 5,
  column: 3,
  endLine: 5,
  mutatorName: 'EqualityOperator',
  replacement: 'a !== b',
  status: 'Killed',
  ...overrides
});

const changed = new Map([
  [
    'src/a.ts',
    [
      { start: 5, end: 6 },
      { start: 20, end: 20 }
    ]
  ]
]);

const report = (overrides: Partial<GateReport> = {}): GateReport => ({
  packageDir: 'packages/x/x-server',
  checked: 3,
  killed: 3,
  failures: [],
  ...overrides
});

describe('evaluateGate', () => {
  it('counts killed and timed out mutants on changed lines as killed', () => {
    const result = evaluateGate(
      {
        packageDir: 'packages/x/x-server',
        mutants: [
          mutant({ status: 'Killed' }),
          mutant({ line: 6, status: 'Timeout' })
        ]
      },
      changed
    );

    expect(result).toEqual({
      packageDir: 'packages/x/x-server',
      checked: 2,
      killed: 2,
      failures: []
    });
  });

  it('fails survived and uncovered mutants on changed lines, sorted by location', () => {
    const survivor = mutant({ line: 20, status: 'Survived' });
    const uncovered = mutant({ line: 5, status: 'NoCoverage' });

    const result = evaluateGate(
      { packageDir: 'packages/x/x-server', mutants: [survivor, uncovered] },
      changed
    );

    expect(result.checked).toBe(2);
    expect(result.killed).toBe(0);
    expect(result.failures).toEqual([uncovered, survivor]);
  });

  it('sorts failures by file before line', () => {
    const later = mutant({ fileName: 'src/b.ts', line: 1, status: 'Survived' });
    const earlier = mutant({ line: 6, status: 'Survived' });

    const result = evaluateGate(
      { packageDir: 'packages/x/x-server', mutants: [later, earlier] },
      new Map([...changed, ['src/b.ts', [{ start: 1, end: 1 }]]])
    );

    expect(result.failures).toEqual([earlier, later]);
  });

  it('ignores mutants outside the changed lines', () => {
    const result = evaluateGate(
      {
        packageDir: 'packages/x/x-server',
        mutants: [
          mutant({ line: 4, status: 'Survived' }),
          mutant({ line: 7, status: 'Survived' }),
          mutant({ fileName: 'src/other.ts', status: 'Survived' })
        ]
      },
      changed
    );

    expect(result).toEqual({
      packageDir: 'packages/x/x-server',
      checked: 0,
      killed: 0,
      failures: []
    });
  });

  it.each(['Ignored', 'CompileError', 'RuntimeError', 'Pending'])(
    'does not count a %s mutant',
    (status) => {
      const result = evaluateGate(
        { packageDir: 'packages/x/x-server', mutants: [mutant({ status })] },
        changed
      );

      expect(result.checked).toBe(0);
      expect(result.failures).toEqual([]);
    }
  );
});

describe('gatePasses', () => {
  it('passes when no report has failures', () => {
    expect(gatePasses([report(), report()])).toBe(true);
  });

  it('passes when there are no reports', () => {
    expect(gatePasses([])).toBe(true);
  });

  it('fails when any report has a failure', () => {
    expect(
      gatePasses([
        report(),
        report({ failures: [mutant({ status: 'Survived' })] })
      ])
    ).toBe(false);
  });
});

describe('formatMutant', () => {
  it('writes a table row with the location, mutator, replacement and status', () => {
    expect(formatMutant(mutant({ status: 'Survived' }))).toBe(
      '| `src/a.ts:5` | EqualityOperator | `a !== b` | Survived |'
    );
  });

  it('trims the whitespace around the replacement', () => {
    expect(formatMutant(mutant({ replacement: '  {}\n' }))).toBe(
      '| `src/a.ts:5` | EqualityOperator | `{}` | Killed |'
    );
  });

  it('escapes pipes and collapses whitespace in the replacement', () => {
    expect(formatMutant(mutant({ replacement: 'a ||\n   b' }))).toBe(
      '| `src/a.ts:5` | EqualityOperator | `a \\|\\| b` | Killed |'
    );
  });

  it('writes an empty replacement when there is none', () => {
    expect(formatMutant(mutant({ replacement: undefined }))).toBe(
      '| `src/a.ts:5` | EqualityOperator | `` | Killed |'
    );
  });
});

describe('DISABLE_COMMENT', () => {
  it.each([
    '// Stryker disable next-line all: reason',
    '/* Stryker disable all */'
  ])('matches %s', (text) => {
    expect(DISABLE_COMMENT.test(text)).toBe(true);
  });

  it('does not match a restore comment', () => {
    expect(DISABLE_COMMENT.test('// Stryker restore all')).toBe(false);
  });
});

describe('formatGateSummary', () => {
  it('says there was nothing to mutate when no package changed', () => {
    expect(formatGateSummary([])).toBe(
      '## Mutation tests\n\nNo source lines changed in `packages/`, so there was nothing to mutate.\n'
    );
  });

  it('reports a passing run with a row per package', () => {
    expect(
      formatGateSummary([
        report(),
        report({ packageDir: 'packages/y/y-model', checked: 0, killed: 0 })
      ])
    ).toBe(
      [
        '## Mutation tests',
        '',
        'Every mutant on a changed line was killed.',
        '',
        '| Package | Mutants on changed lines | Killed | Failed |',
        '| --- | --- | --- | --- |',
        '| `packages/x/x-server` | 3 | 3 | 0 |',
        '| `packages/y/y-model` | 0 | 0 | 0 |',
        ''
      ].join('\n')
    );
  });

  it('lists the failures of each failing package', () => {
    const failure = mutant({ status: 'Survived' });

    expect(
      formatGateSummary([
        report({ killed: 2, failures: [failure] }),
        report({ packageDir: 'packages/y/y-model' })
      ])
    ).toBe(
      [
        '## Mutation tests',
        '',
        'Some mutants on changed lines survived. Add or strengthen a test that kills each one, or change the code so the mutant cannot exist. See "Mutation tests" in `CLAUDE.md`.',
        '',
        '| Package | Mutants on changed lines | Killed | Failed |',
        '| --- | --- | --- | --- |',
        '| `packages/x/x-server` | 3 | 2 | 1 |',
        '| `packages/y/y-model` | 3 | 3 | 0 |',
        '',
        '### Failed in `packages/x/x-server`',
        '',
        '| Location | Mutator | Replacement | Status |',
        '| --- | --- | --- | --- |',
        '| `src/a.ts:5` | EqualityOperator | `a !== b` | Survived |',
        ''
      ].join('\n')
    );
  });

  it('lists the disable comments that were added', () => {
    const comments = [
      {
        file: 'packages/x/x-server/src/a.ts',
        line: 4,
        text: '// Stryker disable next-line all: a | b'
      }
    ];

    expect(formatGateSummary([report()], comments)).toBe(
      [
        '## Mutation tests',
        '',
        'Every mutant on a changed line was killed.',
        '',
        '| Package | Mutants on changed lines | Killed | Failed |',
        '| --- | --- | --- | --- |',
        '| `packages/x/x-server` | 3 | 3 | 0 |',
        '',
        '### Stryker disable comments added',
        '',
        'Each one stops a mutant from being tested. Check that no test could kill it.',
        '',
        '| Location | Comment |',
        '| --- | --- |',
        '| `packages/x/x-server/src/a.ts:4` | `// Stryker disable next-line all: a \\| b` |',
        ''
      ].join('\n')
    );
  });

  it('lists the disable comments even when no package changed', () => {
    expect(
      formatGateSummary(
        [],
        [
          {
            file: 'packages/x/x-server/src/a.ts',
            line: 1,
            text: '// Stryker disable all'
          }
        ]
      )
    ).toBe(
      [
        '## Mutation tests',
        '',
        'No source lines changed in `packages/`, so there was nothing to mutate.',
        '',
        '### Stryker disable comments added',
        '',
        'Each one stops a mutant from being tested. Check that no test could kill it.',
        '',
        '| Location | Comment |',
        '| --- | --- |',
        '| `packages/x/x-server/src/a.ts:1` | `// Stryker disable all` |',
        ''
      ].join('\n')
    );
  });
});
