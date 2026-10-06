import { db } from '@giveaway/testing-integration/database';
import {
  createEntries,
  createHost,
  createSweepstakes
} from '@giveaway/testing-integration/fixtures';

export const createDrawableSweepstakes = async ({
  quotas,
  entries,
  allowMultipleWins = false
}: {
  quotas: number[];
  entries: number;
  allowMultipleWins?: boolean;
}) => {
  const { user, team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    prizes: quotas.map((quota, index) => ({
      name: `Prize ${index + 1}`,
      quota
    })),
    criteria: { allowMultipleWins }
  });
  await createEntries({
    sweepstakesId: sweepstakes.id,
    taskIds: [sweepstakes.tasks[0].id],
    count: entries
  });
  return { ...sweepstakes, slug: team.slug, hostId: user.id };
};

export const findDraws = (sweepstakesId: string) =>
  db.prizeDraw.findMany({
    where: { prize: { sweepstakesId } },
    include: { taskCompletion: { include: { participant: true } } },
    orderBy: { createdAt: 'asc' }
  });

export const countWinners = async (sweepstakesId: string) => {
  const draws = await findDraws(sweepstakesId);
  const counts: Record<string, number> = {};
  for (const draw of draws) {
    if (draw.result === 'WINNER') {
      counts[draw.prizeId] = (counts[draw.prizeId] ?? 0) + 1;
    }
  }
  return counts;
};

export const findWinningUserIds = async (sweepstakesId: string) => {
  const draws = await findDraws(sweepstakesId);
  return draws
    .filter((draw) => draw.result === 'WINNER')
    .map((draw) => draw.taskCompletion.participant.userId);
};
