import db from '@/lib/prisma';
import { scheduleRandomlyAssignPrizesJob } from '@/lib/jobs/util';
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
