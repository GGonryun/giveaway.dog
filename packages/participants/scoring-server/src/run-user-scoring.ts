import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { SCORING_BATCH_SIZE } from '@giveaway/scoring-model/user-scoring';
import { computeUserQualityScore } from './scoring';

export const runUserScoring = async (
  db: PrismaClient,
  { userId }: { userId?: string } = {}
) => {
  const requests = await db.userScoringRequest.findMany({
    ...(userId ? { where: { userId } } : {}),
    take: SCORING_BATCH_SIZE,
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.info('Scoring requests:', requests.length);

  let processed = 0;
  let errors = 0;

  for (const request of requests) {
    const unchanged = {
      where: { id: request.id, updatedAt: request.updatedAt }
    };
    try {
      await db.$transaction(async (tx) => {
        await computeUserQualityScore(tx, request.userId);
        await tx.userScoringRequest.deleteMany(unchanged);
        console.info(`Processed scoring request for user ${request.userId}`);
      });
      processed++;
    } catch (error) {
      console.error(
        `Error processing scoring request for user ${request.userId}:`,
        error
      );
      errors++;
      await db.userScoringRequest.deleteMany(unchanged);
    }
  }

  return { processed, errors, total: requests.length };
};
