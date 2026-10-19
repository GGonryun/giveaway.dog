import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  E2E_MAX_JOB_ROUNDS,
  E2eUserScoringRequest
} from '@giveaway/e2e-model/jobs';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { runUserScoring } from '@giveaway/scoring-server/run-user-scoring';
import { runUserTracking } from '@giveaway/scoring-server/run-user-tracking';
import { ApplicationError } from '@giveaway/util-errors';

export const scoreE2eUser = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eUserScoringRequest;
}) => {
  const email = toE2ePersonaEmail(request.persona, request.ns);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (!user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `User ${email} not found`
    });
  }

  const tracking = { processed: 0, errors: 0 };
  for (let round = 0; round < E2E_MAX_JOB_ROUNDS; round++) {
    const run = await runUserTracking(db, { userId: user.id });
    tracking.processed += run.processed;
    tracking.errors += run.errors;
    if (run.total === 0) break;
  }

  const scoring = await runUserScoring(db, { userId: user.id });
  const quality = await db.userQuality.findFirst({
    where: { userId: user.id },
    select: { score: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  return { userId: user.id, email, tracking, scoring, quality };
};
