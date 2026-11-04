import 'server-only';

import {
  PickerStatus,
  Prisma,
  PrismaClient,
  TeamTier
} from '@giveaway/db-model';
import { toRetentionCutoffs } from '@giveaway/team-model/team/limits';
import {
  DataRetentionMode,
  RETENTION_BATCH_SIZE,
  RETENTION_CHUNK_SIZE,
  deleteInChunks
} from '@giveaway/jobs/retention';

export type XPickerRetentionResult = {
  id: string;
  tier: TeamTier;
  users: number;
  posts: number;
};

const teamOfTier = (tier: TeamTier): Prisma.TwitterPickerWhereInput =>
  tier === TeamTier.FREE
    ? { OR: [{ teamId: null }, { team: { tier } }] }
    : { team: { tier } };

const undrawnUsers = (
  pickerId: string
): Prisma.TwitterPickerUserWhereInput => ({
  pickerId,
  draws: { none: {} }
});

export const findExpiredXPickers = async ({
  db,
  now,
  limit
}: {
  db: PrismaClient;
  now: Date;
  limit: number;
}) => {
  const expired: { id: string; tier: TeamTier }[] = [];
  for (const { tier, cutoff } of toRetentionCutoffs(now)) {
    if (expired.length >= limit) break;
    const rows = await db.twitterPicker.findMany({
      where: {
        dataDeletedAt: null,
        status: PickerStatus.COMPLETE,
        updatedAt: { lt: cutoff },
        ...teamOfTier(tier)
      },
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: limit - expired.length
    });
    expired.push(...rows.map(({ id }) => ({ id, tier })));
  }
  return expired;
};

const deleteXPickerData = async ({
  db,
  pickerId,
  tier,
  mode,
  now
}: {
  db: PrismaClient;
  pickerId: string;
  tier: TeamTier;
  mode: DataRetentionMode;
  now: Date;
}): Promise<XPickerRetentionResult> => {
  if (mode === 'report') {
    const [users, posts] = await Promise.all([
      db.twitterPickerUser.count({ where: undrawnUsers(pickerId) }),
      db.twitterPost.count({ where: { pickerId } })
    ]);
    return { id: pickerId, tier, users, posts };
  }

  const users = await deleteInChunks(async () => {
    const chunk = await db.twitterPickerUser.findMany({
      where: undrawnUsers(pickerId),
      select: { id: true },
      take: RETENTION_CHUNK_SIZE
    });
    const { count } = await db.twitterPickerUser.deleteMany({
      where: { id: { in: chunk.map(({ id }) => id) } }
    });
    return count;
  });
  const posts = await deleteInChunks(async () => {
    const chunk = await db.twitterPost.findMany({
      where: { pickerId },
      select: { id: true },
      take: RETENTION_CHUNK_SIZE
    });
    const { count } = await db.twitterPost.deleteMany({
      where: { id: { in: chunk.map(({ id }) => id) } }
    });
    return count;
  });
  await db.twitterPicker.update({
    where: { id: pickerId },
    data: { dataDeletedAt: now }
  });

  return { id: pickerId, tier, users, posts };
};

export const runXPickerDataRetention = async (
  db: PrismaClient,
  {
    mode,
    now = new Date(),
    limit = RETENTION_BATCH_SIZE
  }: { mode: DataRetentionMode; now?: Date; limit?: number }
) => {
  const expired = await findExpiredXPickers({ db, now, limit });
  const results: XPickerRetentionResult[] = [];
  for (const { id, tier } of expired) {
    results.push(
      await deleteXPickerData({ db, pickerId: id, tier, mode, now })
    );
  }
  return { mode, pickers: results };
};
