import 'server-only';

import db from '@giveaway/db-client/prisma';
import { scheduleRandomlyAssignPrizesJob } from '@giveaway/jobs/util';
export async function scheduleRewards({
  sweepstakesId,
  userId
}: {
  sweepstakesId: string;
  userId: string;
}): Promise<void> {
  'use step';

  await scheduleRandomlyAssignPrizesJob({ db, sweepstakesId });

  await db.userScoringRequest.upsert({
    where: { userId },
    create: { userId },
    update: { updatedAt: new Date() }
  });
}
