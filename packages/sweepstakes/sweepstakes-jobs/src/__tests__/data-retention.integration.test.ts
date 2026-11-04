import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamTier } from '@giveaway/db-model';
import { db } from '@giveaway/testing-integration/database';
import {
  createEntry,
  createHost,
  createSweepstakes,
  createUser,
  nextId
} from '@giveaway/testing-integration/fixtures';
import { runSweepstakesDataRetention } from '../run-data-retention';
import { STATIC_TEMPLATES } from '@giveaway/templates-model/data/static-templates';

const blob = vi.hoisted(() => ({ del: vi.fn() }));
vi.mock('@vercel/blob', () => blob);

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const daysAgo = (days: number, ms = 0) =>
  new Date(NOW.getTime() - days * DAY - ms);

const MEDIA_URL = 'https://abc.public.blob.vercel-storage.com/media.png';
const WINNER_MEDIA_URL =
  'https://abc.public.blob.vercel-storage.com/winner.png';

const mediaTask = {
  type: 'SUBMIT_MEDIA',
  title: 'Share a photo',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

const createEndedGiveaway = async ({
  tier = 'FREE',
  endedDaysAgo,
  endedMsAgo = 0,
  status = 'COMPLETED'
}: {
  tier?: TeamTier;
  endedDaysAgo: number;
  endedMsAgo?: number;
  status?: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
}) => {
  const { team } = await createHost();
  await db.team.update({ where: { id: team.id }, data: { tier } });
  const endDate = daysAgo(endedDaysAgo, endedMsAgo);
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    status,
    tasks: [mediaTask],
    timing: { startDate: new Date(endDate.getTime() - 5 * DAY), endDate }
  });
  const [task] = sweepstakes.tasks;
  const [prize] = sweepstakes.prizes;

  const loser = await createEntry({
    sweepstakesId: sweepstakes.id,
    taskIds: [task.id]
  });
  await db.taskCompletion.update({
    where: { id: loser.taskCompletions[0].id },
    data: { proof: { mediaUrl: MEDIA_URL } }
  });

  const winner = await createEntry({
    sweepstakesId: sweepstakes.id,
    taskIds: [task.id]
  });
  await db.taskCompletion.update({
    where: { id: winner.taskCompletions[0].id },
    data: { proof: { mediaUrl: WINNER_MEDIA_URL } }
  });
  await db.prizeDraw.create({
    data: {
      id: nextId('draw'),
      prizeId: prize.id,
      taskCompletionId: winner.taskCompletions[0].id
    }
  });

  await db.sweepstakesJob.create({
    data: {
      sweepstakesId: sweepstakes.id,
      type: 'PROCESS_EXPIRATION',
      status: 'COMPLETED',
      runAt: endDate
    }
  });
  await db.taskJob.create({ data: { taskId: task.id, status: 'COMPLETED' } });

  return { team, sweepstakes, loser, winner };
};

const participantsOf = (sweepstakesId: string) =>
  db.sweepstakesParticipant.findMany({
    where: { sweepstakesId },
    select: { id: true }
  });

const jobsOf = async (sweepstakesId: string) => ({
  sweepstakes: await db.sweepstakesJob.count({ where: { sweepstakesId } }),
  tasks: await db.taskJob.count({ where: { task: { sweepstakesId } } })
});

const run = () => runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

describe('the data retention of each team tier', () => {
  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'blob-token');
    blob.del.mockReset();
    blob.del.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('[RETAIN-001] deletes the participants, completions, form answers, jobs and uploads of a Free giveaway 90 days after it ends', async () => {
    const { sweepstakes, loser, winner } = await createEndedGiveaway({
      endedDaysAgo: 90,
      endedMsAgo: 1
    });
    const field = await db.sweepstakesFormField.create({
      data: {
        id: nextId('field'),
        type: 'USERNAME',
        label: 'Address',
        audience: {
          create: { sweepstakesId: sweepstakes.id }
        }
      }
    });
    await db.sweepstakesFormValue.create({
      data: { participantId: loser.id, fieldId: field.id, value: 'x' }
    });

    const result = await run();

    expect(result.sweepstakes).toEqual([
      {
        id: sweepstakes.id,
        tier: 'FREE',
        participants: 1,
        files: 1,
        jobs: 2
      }
    ]);
    expect(await participantsOf(sweepstakes.id)).toEqual([{ id: winner.id }]);
    expect(
      await db.taskCompletion.count({ where: { participantId: loser.id } })
    ).toBe(0);
    expect(
      await db.sweepstakesFormValue.count({
        where: { participantId: loser.id }
      })
    ).toBe(0);
    expect(await jobsOf(sweepstakes.id)).toEqual({ sweepstakes: 0, tasks: 0 });
    expect(blob.del).toHaveBeenCalledWith([MEDIA_URL]);
    const saved = await db.sweepstakes.findUniqueOrThrow({
      where: { id: sweepstakes.id }
    });
    expect(saved.dataDeletedAt).toEqual(NOW);
  });

  it('[RETAIN-002] deletes the same data of a Pro giveaway one year after it ends', async () => {
    const kept = await createEndedGiveaway({ tier: 'PRO', endedDaysAgo: 364 });
    const expired = await createEndedGiveaway({
      tier: 'PRO',
      endedDaysAgo: 365,
      endedMsAgo: 1
    });

    await run();

    expect(await participantsOf(kept.sweepstakes.id)).toHaveLength(2);
    expect(await participantsOf(expired.sweepstakes.id)).toEqual([
      { id: expired.winner.id }
    ]);
  });

  it('[RETAIN-003] never deletes the data of an Elite or Alpha giveaway for its age', async () => {
    const elite = await createEndedGiveaway({
      tier: 'ELITE',
      endedDaysAgo: 3000
    });
    const alpha = await createEndedGiveaway({
      tier: 'ALPHA',
      endedDaysAgo: 3000
    });

    const result = await run();

    expect(result.sweepstakes).toEqual([]);
    expect(await participantsOf(elite.sweepstakes.id)).toHaveLength(2);
    expect(await participantsOf(alpha.sweepstakes.id)).toHaveLength(2);
  });

  it('[RETAIN-004] keeps the name, the dates, the prizes and the winners of the giveaway', async () => {
    const { sweepstakes, winner } = await createEndedGiveaway({
      endedDaysAgo: 100
    });

    await run();

    const saved = await db.sweepstakes.findUniqueOrThrow({
      where: { id: sweepstakes.id },
      include: {
        details: true,
        timing: true,
        prizes: true,
        participants: {
          include: { taskCompletions: { include: { draws: true } } }
        }
      }
    });
    expect(saved.details?.name).toBe('Test giveaway');
    expect(saved.timing?.endDate).toEqual(daysAgo(100));
    expect(saved.prizes).toHaveLength(1);
    expect(saved.participants.map(({ id }) => id)).toEqual([winner.id]);
    expect(saved.participants[0].taskCompletions[0].draws).toHaveLength(1);
    expect(blob.del).not.toHaveBeenCalledWith(
      expect.arrayContaining([WINNER_MEDIA_URL])
    );
  });

  it('[RETAIN-005] follows the tier of the team on the day of the deletion', async () => {
    const { team, sweepstakes } = await createEndedGiveaway({
      endedDaysAgo: 100
    });
    await db.team.update({ where: { id: team.id }, data: { tier: 'ELITE' } });

    await run();

    expect(await participantsOf(sweepstakes.id)).toHaveLength(2);
  });

  it('[RETAIN-006] deletes no user account and no data of another giveaway', async () => {
    const expired = await createEndedGiveaway({ endedDaysAgo: 100 });
    const other = await createEndedGiveaway({ endedDaysAgo: 10 });
    const user = await createUser();
    await createEntry({
      sweepstakesId: other.sweepstakes.id,
      taskIds: [other.sweepstakes.tasks[0].id],
      userId: expired.loser.userId
    });
    const users = await db.user.count();

    await run();

    expect(await db.user.count()).toBe(users);
    expect(await db.user.findUnique({ where: { id: user.id } })).not.toBeNull();
    expect(
      await db.user.findUnique({ where: { id: expired.loser.userId } })
    ).not.toBeNull();
    expect(await participantsOf(other.sweepstakes.id)).toHaveLength(3);
    expect(await jobsOf(other.sweepstakes.id)).toEqual({
      sweepstakes: 1,
      tasks: 1
    });
  });

  it('[RETAIN-011] deletes no data of a giveaway before the retention period of its team tier ends', async () => {
    const free = await createEndedGiveaway({ endedDaysAgo: 90 });
    const pro = await createEndedGiveaway({ tier: 'PRO', endedDaysAgo: 365 });
    const running = await createEndedGiveaway({
      endedDaysAgo: -1,
      status: 'ACTIVE'
    });

    const result = await run();

    expect(result.sweepstakes).toEqual([]);
    for (const { sweepstakes } of [free, pro, running]) {
      expect(await participantsOf(sweepstakes.id)).toHaveLength(2);
      expect(await jobsOf(sweepstakes.id)).toEqual({
        sweepstakes: 1,
        tasks: 1
      });
    }
    expect(blob.del).not.toHaveBeenCalled();
  });

  it('skips a draft, and a giveaway whose data was already deleted', async () => {
    const draft = await createEndedGiveaway({
      endedDaysAgo: 100,
      status: 'DRAFT'
    });
    const done = await createEndedGiveaway({ endedDaysAgo: 100 });
    await db.sweepstakes.update({
      where: { id: done.sweepstakes.id },
      data: { dataDeletedAt: daysAgo(1) }
    });

    const result = await run();

    expect(result.sweepstakes).toEqual([]);
    expect(await participantsOf(draft.sweepstakes.id)).toHaveLength(2);
    expect(await participantsOf(done.sweepstakes.id)).toHaveLength(2);
  });

  it('only counts the data in report mode', async () => {
    const { sweepstakes } = await createEndedGiveaway({ endedDaysAgo: 100 });

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'report',
      sweepstakes: [
        {
          id: sweepstakes.id,
          tier: 'FREE',
          participants: 1,
          files: 1,
          jobs: 2
        }
      ]
    });
    expect(await participantsOf(sweepstakes.id)).toHaveLength(2);
    expect(blob.del).not.toHaveBeenCalled();
    const saved = await db.sweepstakes.findUniqueOrThrow({
      where: { id: sweepstakes.id }
    });
    expect(saved.dataDeletedAt).toBeNull();
  });

  it('keeps the uploads but deletes the rows without a Blob token', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sweepstakes } = await createEndedGiveaway({ endedDaysAgo: 100 });

    const result = await run();

    expect(result.sweepstakes[0].files).toBe(0);
    expect(blob.del).not.toHaveBeenCalled();
    expect(await participantsOf(sweepstakes.id)).toHaveLength(1);
  });

  it('keeps every row when the uploads cannot be deleted', async () => {
    blob.del.mockRejectedValue(new Error('blob down'));
    const { sweepstakes } = await createEndedGiveaway({ endedDaysAgo: 100 });

    await expect(run()).rejects.toThrow('blob down');

    expect(await participantsOf(sweepstakes.id)).toHaveLength(2);
    expect(await jobsOf(sweepstakes.id)).toEqual({ sweepstakes: 1, tasks: 1 });
  });

  it('deletes the oldest giveaways first, up to the limit', async () => {
    const first = await createEndedGiveaway({ endedDaysAgo: 100 });
    const second = await createEndedGiveaway({ endedDaysAgo: 100 });

    const result = await runSweepstakesDataRetention(db, {
      mode: 'delete',
      now: NOW,
      limit: 1
    });

    expect(result.sweepstakes.map(({ id }) => id)).toEqual([
      first.sweepstakes.id
    ]);
    expect(await participantsOf(second.sweepstakes.id)).toHaveLength(2);
  });

  describe('the banner', () => {
    const BANNER = 'https://abc.public.blob.vercel-storage.com/banner.png';

    const withBanner = async (banner: string) => {
      const giveaway = await createEndedGiveaway({ endedDaysAgo: 100 });
      await db.sweepstakesDetails.update({
        where: { sweepstakesId: giveaway.sweepstakes.id },
        data: { banner }
      });
      return giveaway;
    };

    const bannerOf = async (sweepstakesId: string) =>
      (
        await db.sweepstakesDetails.findUniqueOrThrow({
          where: { sweepstakesId }
        })
      ).banner;

    it('[RETAIN-014] the deletion also deletes the banner and the prize images of the giveaway', async () => {
      const { sweepstakes } = await withBanner(BANNER);

      const result = await run();

      expect(blob.del).toHaveBeenCalledWith([BANNER]);
      expect(result.sweepstakes[0].files).toBe(2);
      expect(await bannerOf(sweepstakes.id)).toBeNull();
      const details = await db.sweepstakesDetails.findUniqueOrThrow({
        where: { sweepstakesId: sweepstakes.id }
      });
      expect(details.name).toBe('Test giveaway');
    });

    it('[RETAIN-014] the deletion keeps an image that another giveaway still uses', async () => {
      const { sweepstakes } = await withBanner(BANNER);
      const { team } = await createHost();
      const other = await createSweepstakes({ teamId: team.id });
      await db.sweepstakesDetails.update({
        where: { sweepstakesId: other.id },
        data: { banner: BANNER }
      });

      await run();

      expect(blob.del).not.toHaveBeenCalledWith([BANNER]);
      expect(await bannerOf(sweepstakes.id)).toBe(BANNER);
    });

    it('[RETAIN-014] the deletion keeps an image that a template still uses', async () => {
      const { sweepstakes, team } = await withBanner(BANNER);
      await db.template.create({
        data: {
          name: 'Saved',
          description: 'Saved template',
          image: 'https://abc.public.blob.vercel-storage.com/other.png',
          teamId: team.id,
          content: { setup: { banner: BANNER } }
        }
      });

      await run();

      expect(blob.del).not.toHaveBeenCalledWith([BANNER]);
      expect(await bannerOf(sweepstakes.id)).toBe(BANNER);
    });

    it('keeps an image that is the image of a template or the logo of a team', async () => {
      const first = await withBanner(BANNER);
      await db.template.create({
        data: {
          name: 'Saved',
          description: 'Saved template',
          image: BANNER,
          teamId: first.team.id,
          content: {}
        }
      });
      const logo = 'https://abc.public.blob.vercel-storage.com/logo.png';
      const second = await withBanner(logo);
      await db.team.update({
        where: { id: second.team.id },
        data: { logo }
      });

      await run();

      expect(await bannerOf(first.sweepstakes.id)).toBe(BANNER);
      expect(await bannerOf(second.sweepstakes.id)).toBe(logo);
    });

    it('keeps the banner of a built-in template', async () => {
      const banner = STATIC_TEMPLATES[0].setup.banner;
      const { sweepstakes } = await withBanner(banner);

      await run();

      expect(blob.del).not.toHaveBeenCalledWith([banner]);
      expect(await bannerOf(sweepstakes.id)).toBe(banner);
    });

    it('keeps the banner and its URL when the Blob token is missing', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { sweepstakes } = await withBanner(BANNER);

      await run();

      expect(await bannerOf(sweepstakes.id)).toBe(BANNER);
    });
  });
});
