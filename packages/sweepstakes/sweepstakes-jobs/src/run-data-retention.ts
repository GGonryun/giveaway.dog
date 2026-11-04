import 'server-only';

import {
  Prisma,
  PrismaClient,
  SweepstakesStatus,
  TeamTier
} from '@giveaway/db-model';
import { toRetentionCutoffs } from '@giveaway/team-model/team/limits';
import {
  DataRetentionMode,
  deleteUploadedFiles,
  toUploadedFiles
} from '@giveaway/jobs/retention';

const DEFAULT_LIMIT = 20;
const COMPLETION_PAGE_SIZE = 1000;

export type SweepstakesRetentionResult = {
  id: string;
  tier: TeamTier;
  participants: number;
  files: number;
  jobs: number;
};

const teamOfTier = (tier: TeamTier): Prisma.SweepstakesWhereInput =>
  tier === TeamTier.FREE
    ? { OR: [{ teamId: null }, { team: { tier } }] }
    : { team: { tier } };

const deletableParticipants = (
  sweepstakesId: string
): Prisma.SweepstakesParticipantWhereInput => ({
  sweepstakesId,
  taskCompletions: { none: { draws: { some: {} } } }
});

const toMediaUrl = (proof: Prisma.JsonValue): unknown =>
  (proof as { mediaUrl?: unknown } | null)?.mediaUrl;

const findMediaUrls = async (
  db: PrismaClient,
  sweepstakesId: string,
  cursor?: string
): Promise<unknown[]> => {
  const page = await db.taskCompletion.findMany({
    where: {
      participant: deletableParticipants(sweepstakesId),
      task: { config: { path: ['type'], equals: 'SUBMIT_MEDIA' } }
    },
    select: { id: true, proof: true },
    orderBy: { id: 'asc' },
    take: COMPLETION_PAGE_SIZE,
    ...(cursor && { cursor: { id: cursor }, skip: 1 })
  });
  const urls = page.map(({ proof }) => toMediaUrl(proof));
  if (page.length < COMPLETION_PAGE_SIZE) return urls;
  return [
    ...urls,
    ...(await findMediaUrls(db, sweepstakesId, page[page.length - 1].id))
  ];
};

const countJobs = async (db: PrismaClient, sweepstakesId: string) => {
  const [sweepstakes, tasks, posts] = await Promise.all([
    db.sweepstakesJob.count({ where: { sweepstakesId } }),
    db.taskJob.count({ where: { task: { sweepstakesId } } }),
    db.automatedPostJob.count({ where: { sweepstakesId } })
  ]);
  return sweepstakes + tasks + posts;
};

const deleteSweepstakesData = async ({
  db,
  sweepstakesId,
  tier,
  mode,
  now
}: {
  db: PrismaClient;
  sweepstakesId: string;
  tier: TeamTier;
  mode: DataRetentionMode;
  now: Date;
}): Promise<SweepstakesRetentionResult> => {
  const [participants, urls, jobs] = await Promise.all([
    db.sweepstakesParticipant.count({
      where: deletableParticipants(sweepstakesId)
    }),
    findMediaUrls(db, sweepstakesId),
    countJobs(db, sweepstakesId)
  ]);

  if (mode === 'report') {
    return {
      id: sweepstakesId,
      tier,
      participants,
      files: toUploadedFiles(urls).length,
      jobs
    };
  }

  const files = await deleteUploadedFiles(urls);

  await db.$transaction([
    db.sweepstakesParticipant.deleteMany({
      where: deletableParticipants(sweepstakesId)
    }),
    db.sweepstakesJob.deleteMany({ where: { sweepstakesId } }),
    db.taskJob.deleteMany({ where: { task: { sweepstakesId } } }),
    db.automatedPostJob.deleteMany({ where: { sweepstakesId } }),
    db.sweepstakes.update({
      where: { id: sweepstakesId },
      data: { dataDeletedAt: now }
    })
  ]);

  return { id: sweepstakesId, tier, participants, files, jobs };
};

export const findExpiredSweepstakes = async ({
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
    const rows = await db.sweepstakes.findMany({
      where: {
        dataDeletedAt: null,
        status: {
          in: [SweepstakesStatus.ACTIVE, SweepstakesStatus.COMPLETED]
        },
        timing: { endDate: { lt: cutoff } },
        ...teamOfTier(tier)
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: limit - expired.length
    });
    expired.push(...rows.map(({ id }) => ({ id, tier })));
  }
  return expired;
};

export const runSweepstakesDataRetention = async (
  db: PrismaClient,
  {
    mode,
    now = new Date(),
    limit = DEFAULT_LIMIT
  }: { mode: DataRetentionMode; now?: Date; limit?: number }
) => {
  const expired = await findExpiredSweepstakes({ db, now, limit });
  const results: SweepstakesRetentionResult[] = [];
  for (const { id, tier } of expired) {
    results.push(
      await deleteSweepstakesData({ db, sweepstakesId: id, tier, mode, now })
    );
  }
  return { mode, sweepstakes: results };
};
