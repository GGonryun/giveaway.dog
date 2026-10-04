import prisma from '@giveaway/db-client/prisma';

import { NextRequest, NextResponse } from 'next/server';

import { MAX_SCORING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import { computeUserQualityScore } from '@/lib/scoring';
import { isValidCronSecret } from '@giveaway/jobs/util';

export async function GET(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.userScoringRequest.findMany({
    take: MAX_SCORING_REQUESTS_PER_RUN,
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.info('Scoring requests:', requests.length);

  // compute user quality scores for users who had an event published in the last 24 hours.
  for (const request of requests) {
    await prisma.$transaction(async (tx) => {
      await computeUserQualityScore(tx, request.userId);
      await prisma.userScoringRequest.delete({
        where: { id: request.id }
      });
      console.info(`Processed scoring request for user ${request.userId}`);
    });
  }

  return NextResponse.json({ processed: requests.length });
}
