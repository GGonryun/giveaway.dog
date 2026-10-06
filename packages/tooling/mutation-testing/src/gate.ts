import { isInRanges, type AddedLine, type LineRange } from './changed-lines.ts';

export type MutantOutcome = {
  fileName: string;
  line: number;
  column: number;
  endLine: number;
  mutatorName: string;
  replacement?: string;
  status: string;
  testsCompleted?: number;
};

export type PackageOutcome = {
  packageDir: string;
  mutants: MutantOutcome[];
};

export type GateReport = {
  packageDir: string;
  checked: number;
  killed: number;
  failures: MutantOutcome[];
};

export const DISABLE_COMMENT = /Stryker disable/;

const FAILING_STATUSES = new Set(['Survived', 'NoCoverage']);

const KILLED_STATUSES = new Set(['Killed', 'Timeout']);

export const byLocation = (a: MutantOutcome, b: MutantOutcome): number =>
  a.fileName.localeCompare(b.fileName) || a.line - b.line;

export const evaluateGate = (
  outcome: PackageOutcome,
  changed: Map<string, LineRange[]>
): GateReport => {
  const inChangedLines = outcome.mutants.filter((mutant) =>
    isInRanges(mutant.line, changed.get(mutant.fileName))
  );
  const tested = inChangedLines.filter(
    (mutant) =>
      FAILING_STATUSES.has(mutant.status) || KILLED_STATUSES.has(mutant.status)
  );

  return {
    packageDir: outcome.packageDir,
    checked: tested.length,
    killed: tested.filter((mutant) => KILLED_STATUSES.has(mutant.status))
      .length,
    failures: tested
      .filter((mutant) => FAILING_STATUSES.has(mutant.status))
      .sort(byLocation)
  };
};

export const gatePasses = (reports: GateReport[]): boolean =>
  reports.every((report) => report.failures.length === 0);

const escapeCell = (text: string): string =>
  text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

export const formatMutant = (mutant: MutantOutcome): string =>
  `| \`${mutant.fileName}:${mutant.line}\` | ${mutant.mutatorName} | \`${escapeCell(mutant.replacement ?? '')}\` | ${mutant.status} |`;

const MUTANT_TABLE_HEADER = [
  '| Location | Mutator | Replacement | Status |',
  '| --- | --- | --- | --- |'
];

const formatDisableComments = (comments: AddedLine[]): string[] =>
  comments.length === 0
    ? []
    : [
        '',
        '### Stryker disable comments added',
        '',
        'Each one stops a mutant from being tested. Check that no test could kill it.',
        '',
        '| Location | Comment |',
        '| --- | --- |',
        ...comments.map(
          (comment) =>
            `| \`${comment.file}:${comment.line}\` | \`${escapeCell(comment.text)}\` |`
        )
      ];

export const formatGateSummary = (
  reports: GateReport[],
  disableComments: AddedLine[] = []
): string => {
  if (reports.length === 0) {
    return [
      '## Mutation tests',
      '',
      'No source lines changed in `packages/`, so there was nothing to mutate.',
      ...formatDisableComments(disableComments),
      ''
    ].join('\n');
  }

  const lines = [
    '## Mutation tests',
    '',
    gatePasses(reports)
      ? 'Every mutant on a changed line was killed.'
      : 'Some mutants on changed lines survived. Add or strengthen a test that kills each one, or change the code so the mutant cannot exist. See "Mutation tests" in `CLAUDE.md`.',
    '',
    '| Package | Mutants on changed lines | Killed | Failed |',
    '| --- | --- | --- | --- |',
    ...reports.map(
      (report) =>
        `| \`${report.packageDir}\` | ${report.checked} | ${report.killed} | ${report.failures.length} |`
    )
  ];

  for (const report of reports.filter((r) => r.failures.length > 0)) {
    lines.push(
      '',
      `### Failed in \`${report.packageDir}\``,
      '',
      ...MUTANT_TABLE_HEADER,
      ...report.failures.map(formatMutant)
    );
  }

  lines.push(...formatDisableComments(disableComments));

  return `${lines.join('\n')}\n`;
};
