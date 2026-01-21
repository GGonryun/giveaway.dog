import {
  PrismaClient,
  SweepstakesJobStatus,
  SweepstakesJobType
} from '@prisma/client';
import { NextRequest } from 'next/server';

export const isValidCronSecret = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false;
  }
  return true;
};

export const scheduleRandomlyAssignPrizesJob = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  await db.sweepstakesJob.upsert({
    where: {
      sweepstakesId_type: {
        sweepstakesId,
        type: SweepstakesJobType.RANDOMLY_ASSIGN_PRIZES
      }
    },
    create: {
      sweepstakesId: sweepstakesId,
      type: SweepstakesJobType.RANDOMLY_ASSIGN_PRIZES,
      status: SweepstakesJobStatus.PENDING,
      runAt: new Date()
    },
    update: {
      status: SweepstakesJobStatus.PENDING,
      runAt: new Date()
    }
  });
};
