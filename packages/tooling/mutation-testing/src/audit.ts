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

export const reportFolderName = (packageName: string): string =>
  packageName.replace(/^@giveaway\//, '');

const howToFix = (packageName: string): string[] => {
  const folder = reportFolderName(packageName);
  return [
    '',
    '### How to fix',
    '',
    `1. Reproduce: \`pnpm run test:mutation ${packageName}\` prints this report and writes the HTML report, which shows each mutant in the source, to \`reports/mutation/${folder}/mutation.html\`. The \`mutation-audit-${folder}\` artifact of the run has the same report.`,
    '2. For each survivor, add or change a test so that it fails with the mutant in place. If no test can kill it because the mutant cannot change behavior, change the code so that the mutant cannot exist. Only when neither works, add `// Stryker disable next-line <Mutator>: <reason>` above the line. See "Mutation Tests" in `CLAUDE.md`.',
    '3. Run the command again until no mutant survives, and open a pull request that closes this issue.'
  ];
};

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
    ...(runUrl ? ['', `Run: ${runUrl}`] : []),
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
    lines.push(...howToFix(packageName));
  }

  return `${lines.join('\n')}\n`;
};
