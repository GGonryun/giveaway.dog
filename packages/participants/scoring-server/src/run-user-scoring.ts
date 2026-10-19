import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { MAX_SCORING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import { computeUserQualityScore } from './scoring';

export const runUserScoring = async (
  db: PrismaClient,
  { userId }: { userId?: string } = {}
) => {
  const requests = await db.userScoringRequest.findMany({
    ...(userId ? { where: { userId } } : {}),
    take: MAX_SCORING_REQUESTS_PER_RUN,
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.info('Scoring requests:', requests.length);

  for (const request of requests) {
    await db.$transaction(async (tx) => {
      await computeUserQualityScore(tx, request.userId);
      await db.userScoringRequest.delete({
        where: { id: request.id }
      });
      console.info(`Processed scoring request for user ${request.userId}`);
    });
  }

  return { processed: requests.length };
};
