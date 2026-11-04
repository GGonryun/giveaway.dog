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
  RETENTION_BATCH_SIZE,
  RETENTION_CHUNK_SIZE,
  deleteInChunks,
  deleteUploadedFiles,
  isUploadedFileUrl
} from '@giveaway/jobs/retention';
import { STATIC_TEMPLATES } from '@giveaway/templates-model/data/static-templates';

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

const MEDIA_TASK: Prisma.TaskWhereInput = {
  config: { path: ['type'], equals: 'SUBMIT_MEDIA' }
};

const sweepstakesJobs = (sweepstakesId: string) => ({
  sweepstakes: { sweepstakesId },
  tasks: { task: { sweepstakesId } },
  posts: { sweepstakesId }
});

const countJobs = async (db: PrismaClient, sweepstakesId: string) => {
  const where = sweepstakesJobs(sweepstakesId);
  const [sweepstakes, tasks, posts] = await Promise.all([
    db.sweepstakesJob.count({ where: where.sweepstakes }),
    db.taskJob.count({ where: where.tasks }),
    db.automatedPostJob.count({ where: where.posts })
  ]);
  return sweepstakes + tasks + posts;
};

const STATIC_IMAGES = new Set(
  STATIC_TEMPLATES.flatMap(({ template, setup }) => [
    template.image,
    setup.banner
  ])
);

const isImageInUse = async (
  db: PrismaClient,
  sweepstakesId: string,
  url: string
) => {
  const uses = await Promise.all([
    db.sweepstakesDetails.count({
      where: { banner: url, sweepstakesId: { not: sweepstakesId } }
    }),
    db.template.count({
      where: {
        OR: [
          { image: url },
          { content: { path: ['setup', 'banner'], equals: url } }
        ]
      }
    }),
    db.team.count({ where: { logo: url } })
  ]);
  return STATIC_IMAGES.has(url) || uses.some((count) => count > 0);
};

const findDeletableBanner = async (
  db: PrismaClient,
  sweepstakesId: string
): Promise<string | null> => {
  const details = await db.sweepstakesDetails.findUnique({
    where: { sweepstakesId },
    select: { banner: true }
  });
  const banner = details?.banner;
  if (!isUploadedFileUrl(banner)) return null;
  return (await isImageInUse(db, sweepstakesId, banner)) ? null : banner;
};

const reportSweepstakesData = async (
  db: PrismaClient,
  sweepstakesId: string
) => {
  const [participants, files, banner, jobs] = await Promise.all([
    db.sweepstakesParticipant.count({
      where: deletableParticipants(sweepstakesId)
    }),
    db.taskCompletion.count({
      where: {
        participant: deletableParticipants(sweepstakesId),
        task: MEDIA_TASK
      }
    }),
    findDeletableBanner(db, sweepstakesId),
    countJobs(db, sweepstakesId)
  ]);
  return { participants, files: files + (banner ? 1 : 0), jobs };
};

const deleteParticipantChunk = async (
  db: PrismaClient,
  sweepstakesId: string,
  counts: { files: number }
) => {
  const chunk = await db.sweepstakesParticipant.findMany({
    where: deletableParticipants(sweepstakesId),
    select: { id: true },
    take: RETENTION_CHUNK_SIZE
  });
  const ids = chunk.map(({ id }) => id);
  const media = await db.taskCompletion.findMany({
    where: { participantId: { in: ids }, task: MEDIA_TASK },
    select: { proof: true }
  });
  counts.files += await deleteUploadedFiles(
    media.map(({ proof }) => toMediaUrl(proof))
  );
  const { count } = await db.sweepstakesParticipant.deleteMany({
    where: { id: { in: ids } }
  });
  return count;
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
  if (mode === 'report') {
    return {
      id: sweepstakesId,
      tier,
      ...(await reportSweepstakesData(db, sweepstakesId))
    };
  }

  const counts = { files: 0 };
  const participants = await deleteInChunks(() =>
    deleteParticipantChunk(db, sweepstakesId, counts)
  );

  const banner = await findDeletableBanner(db, sweepstakesId);
  const bannerFiles = banner ? await deleteUploadedFiles([banner]) : 0;

  const where = sweepstakesJobs(sweepstakesId);
  const [sweepstakesJobCount, taskJobs, posts] = await db.$transaction([
    db.sweepstakesJob.deleteMany({ where: where.sweepstakes }),
    db.taskJob.deleteMany({ where: where.tasks }),
    db.automatedPostJob.deleteMany({ where: where.posts }),
    db.sweepstakes.update({
      where: { id: sweepstakesId },
      data: {
        dataDeletedAt: now,
        ...(bannerFiles > 0 && { details: { update: { banner: null } } })
      }
    })
  ]);

  return {
    id: sweepstakesId,
    tier,
    participants,
    files: counts.files + bannerFiles,
    jobs: sweepstakesJobCount.count + taskJobs.count + posts.count
  };
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
    limit = RETENTION_BATCH_SIZE
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
