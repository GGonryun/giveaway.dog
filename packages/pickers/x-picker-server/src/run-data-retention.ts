import 'server-only';

import {
  PickerStatus,
  Prisma,
  PrismaClient,
  TeamTier
} from '@giveaway/db-model';
import { toRetentionCutoffs } from '@giveaway/team-model/team/limits';
import { DataRetentionMode } from '@giveaway/jobs/retention';

const DEFAULT_LIMIT = 50;

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

  const [users, posts] = await db.$transaction([
    db.twitterPickerUser.deleteMany({ where: undrawnUsers(pickerId) }),
    db.twitterPost.deleteMany({ where: { pickerId } }),
    db.twitterPicker.update({
      where: { id: pickerId },
      data: { dataDeletedAt: now }
    })
  ]);

  return { id: pickerId, tier, users: users.count, posts: posts.count };
};

export const runXPickerDataRetention = async (
  db: PrismaClient,
  {
    mode,
    now = new Date(),
    limit = DEFAULT_LIMIT
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
