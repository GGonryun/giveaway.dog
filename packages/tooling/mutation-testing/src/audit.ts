import { byLocation, formatMutant, type MutantOutcome } from './gate.ts';

export type FileScore = {
  fileName: string;
  killed: number;
  survived: number;
  noCoverage: number;
};

export const MAX_LISTED_SURVIVORS = 100;

const KILLED_STATUSES = new Set(['Killed', 'Timeout']);

export const scoreOf = (score: Omit<FileScore, 'fileName'>): number | null => {
  const total = score.killed + score.survived + score.noCoverage;
  return total === 0 ? null : (score.killed / total) * 100;
};

export const fileScores = (mutants: MutantOutcome[]): FileScore[] => {
  const scores = new Map<string, FileScore>();
  for (const mutant of mutants) {
    const score = scores.get(mutant.fileName) ?? {
      fileName: mutant.fileName,
      killed: 0,
      survived: 0,
      noCoverage: 0
    };
    if (KILLED_STATUSES.has(mutant.status)) score.killed++;
    if (mutant.status === 'Survived') score.survived++;
    if (mutant.status === 'NoCoverage') score.noCoverage++;
    scores.set(mutant.fileName, score);
  }
  return [...scores.values()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName)
  );
};

export const totalScore = (scores: FileScore[]): Omit<FileScore, 'fileName'> =>
  scores.reduce(
    (total, score) => ({
      killed: total.killed + score.killed,
      survived: total.survived + score.survived,
      noCoverage: total.noCoverage + score.noCoverage
    }),
    { killed: 0, survived: 0, noCoverage: 0 }
  );

const formatScore = (score: number | null): string =>
  score === null ? 'n/a' : `${score.toFixed(1)}%`;

export const auditIssueTitle = (packageName: string): string =>
  `Mutation audit: ${packageName}`;

export const formatAuditReport = ({
  packageName,
  packageDir,
  mutants,
  runUrl
}: {
  packageName: string;
  packageDir: string;
  mutants: MutantOutcome[];
  runUrl?: string;
}): string => {
  const scores = fileScores(mutants);
  const total = totalScore(scores);
  const survivors = mutants
    .filter(
      (mutant) => mutant.status === 'Survived' || mutant.status === 'NoCoverage'
    )
    .sort(byLocation);

  const lines = [
    `## ${auditIssueTitle(packageName)}`,
    '',
    `Package: \`${packageDir}\`. Mutation score: **${formatScore(scoreOf(total))}** (${total.killed} killed, ${total.survived} survived, ${total.noCoverage} not covered).`,
    ...(runUrl ? ['', `Run and HTML report: ${runUrl}`] : []),
    '',
    '| File | Score | Killed | Survived | Not covered |',
    '| --- | --- | --- | --- | --- |',
    ...scores.map(
      (score) =>
        `| \`${score.fileName}\` | ${formatScore(scoreOf(score))} | ${score.killed} | ${score.survived} | ${score.noCoverage} |`
    )
  ];

  if (survivors.length === 0) {
    lines.push('', 'No mutant survived.');
  } else {
    lines.push(
      '',
      '### Survivors',
      '',
      'For each one, add or strengthen a test that kills it, or change the code so the mutant cannot exist. See "Mutation tests" in `CLAUDE.md`.',
      '',
      '| Location | Mutator | Replacement | Status |',
      '| --- | --- | --- | --- |',
      ...survivors.slice(0, MAX_LISTED_SURVIVORS).map(formatMutant)
    );
    if (survivors.length > MAX_LISTED_SURVIVORS) {
      lines.push(
        '',
        `${survivors.length - MAX_LISTED_SURVIVORS} more are in the HTML report.`
      );
    }
  }

  return `${lines.join('\n')}\n`;
};
