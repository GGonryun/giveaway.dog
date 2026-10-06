import { PrismaClient } from '@prisma/client';
import { truncateTables } from '@giveaway/testing-postgres/database';

export const db = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_URL
});

export const resetDatabase = () => truncateTables(db);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const countLockWaiters = async (table: string) => {
  const [{ count }] = await db.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM pg_locks
    WHERE NOT granted AND relation = to_regclass(${`"${table}"`})
  `;
  return count;
};

export const holdTableWrites = async <T>(
  table: string,
  { writers, timeout = 3_000 }: { writers: number; timeout?: number },
  run: () => Promise<T>
): Promise<T> => {
  const { pending } = await db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`LOCK TABLE "${table}" IN EXCLUSIVE MODE`);
      let settled = false;
      const pending = run();
      pending.then(
        () => (settled = true),
        () => (settled = true)
      );
      const deadline = Date.now() + timeout;
      while (
        !settled &&
        Date.now() < deadline &&
        (await countLockWaiters(table)) < writers
      ) {
        await sleep(20);
      }
      return { pending };
    },
    { timeout: timeout + 10_000 }
  );
  return pending;
};
