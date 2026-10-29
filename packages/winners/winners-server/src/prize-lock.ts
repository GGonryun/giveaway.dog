import 'server-only';

import { Prisma, PrismaClient } from '@giveaway/db-model';

export const PRIZE_LOCK_TIMEOUT_MS = 15_000;

export const withLockedPrizes = <T>({
  db,
  sweepstakesId,
  run
}: {
  db: PrismaClient;
  sweepstakesId: string;
  run: (tx: Prisma.TransactionClient) => Promise<T>;
}): Promise<T> =>
  db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT id FROM "Prize" WHERE "sweepstakesId" = ${sweepstakesId} FOR UPDATE`;
      return run(tx);
    },
    { timeout: PRIZE_LOCK_TIMEOUT_MS }
  );
