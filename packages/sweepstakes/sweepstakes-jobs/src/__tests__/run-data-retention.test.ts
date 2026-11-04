import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { runSweepstakesDataRetention } from '../run-data-retention';
import { STATIC_TEMPLATES } from '@giveaway/templates-model/data/static-templates';

const blob = vi.hoisted(() => ({ del: vi.fn() }));
vi.mock('@vercel/blob', () => blob);

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = prismaMock as unknown as PrismaClient;

const FREE_CUTOFF = new Date(NOW.getTime() - 90 * DAY);
const PRO_CUTOFF = new Date(NOW.getTime() - 365 * DAY);
const MEDIA = 'https://abc.public.blob.vercel-storage.com/media.png';
const MEDIA_TASK = { config: { path: ['type'], equals: 'SUBMIT_MEDIA' } };

const deletable = (sweepstakesId: string) => ({
  sweepstakesId,
  taskCompletions: { none: { draws: { some: {} } } }
});

const ended = (cutoff: Date, team: object) => ({
  dataDeletedAt: null,
  status: { in: ['ACTIVE', 'COMPLETED'] },
  timing: { endDate: { lt: cutoff } },
  ...team
});

const ids = (...values: string[]) => values.map((id) => ({ id }));

describe('runSweepstakesDataRetention', () => {
  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token');
    blob.del.mockReset();
    blob.del.mockResolvedValue(undefined);
    prismaMock.sweepstakes.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesParticipant.deleteMany.mockResolvedValue({
      count: 0
    });
    prismaMock.taskCompletion.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesJob.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.taskJob.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.automatedPostJob.deleteMany.mockResolvedValue({ count: 3 });
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(5);
    prismaMock.taskCompletion.count.mockResolvedValue(4);
    prismaMock.sweepstakesJob.count.mockResolvedValue(1);
    prismaMock.taskJob.count.mockResolvedValue(2);
    prismaMock.automatedPostJob.count.mockResolvedValue(3);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('finds 5 ended giveaways of each retained tier past its cutoff, oldest first', async () => {
    await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

    expect(prismaMock.sweepstakes.findMany.mock.calls).toEqual([
      [
        {
          where: ended(FREE_CUTOFF, {
            OR: [{ teamId: null }, { team: { tier: 'FREE' } }]
          }),
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          take: 5
        }
      ],
      [
        {
          where: ended(PRO_CUTOFF, { team: { tier: 'PRO' } }),
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          take: 5
        }
      ]
    ]);
  });

  it('deletes the participants without a draw and their uploads 500 at a time, then the jobs, then marks the giveaway', async () => {
    prismaMock.sweepstakes.findMany
      .mockResolvedValueOnce(ids('sweep-free'))
      .mockResolvedValueOnce([]);
    prismaMock.sweepstakesParticipant.findMany
      .mockResolvedValueOnce(ids('p1', 'p2'))
      .mockResolvedValueOnce(ids('p3'))
      .mockResolvedValueOnce([]);
    prismaMock.sweepstakesParticipant.deleteMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    prismaMock.taskCompletion.findMany
      .mockResolvedValueOnce([
        { proof: { mediaUrl: MEDIA } },
        { proof: { mediaUrl: 42 } },
        { proof: ['x'] },
        { proof: null }
      ] as never)
      .mockResolvedValue([]);

    const result = await runSweepstakesDataRetention(db, {
      mode: 'delete',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'delete',
      sweepstakes: [
        { id: 'sweep-free', tier: 'FREE', participants: 3, files: 1, jobs: 6 }
      ]
    });
    expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
      where: deletable('sweep-free'),
      select: { id: true },
      take: 500
    });
    expect(prismaMock.taskCompletion.findMany.mock.calls[0][0]).toEqual({
      where: { participantId: { in: ['p1', 'p2'] }, task: MEDIA_TASK },
      select: { proof: true }
    });
    expect(blob.del).toHaveBeenCalledTimes(1);
    expect(blob.del).toHaveBeenCalledWith([MEDIA]);
    expect(
      prismaMock.sweepstakesParticipant.deleteMany.mock.calls.map(
        ([args]) => args
      )
    ).toEqual([
      { where: { id: { in: ['p1', 'p2'] } } },
      { where: { id: { in: ['p3'] } } },
      { where: { id: { in: [] } } }
    ]);
    expect(prismaMock.sweepstakesJob.deleteMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-free' }
    });
    expect(prismaMock.taskJob.deleteMany).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sweep-free' } }
    });
    expect(prismaMock.automatedPostJob.deleteMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-free' }
    });
    expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
      where: { id: 'sweep-free' },
      data: { dataDeletedAt: NOW }
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('counts the rows in report mode and changes nothing', async () => {
    prismaMock.sweepstakes.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(ids('sweep-pro'));

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'report',
      sweepstakes: [
        { id: 'sweep-pro', tier: 'PRO', participants: 5, files: 4, jobs: 6 }
      ]
    });
    expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
      where: deletable('sweep-pro')
    });
    expect(prismaMock.taskCompletion.count).toHaveBeenCalledWith({
      where: { participant: deletable('sweep-pro'), task: MEDIA_TASK }
    });
    expect(prismaMock.sweepstakesJob.count).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-pro' }
    });
    expect(prismaMock.taskJob.count).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sweep-pro' } }
    });
    expect(prismaMock.automatedPostJob.count).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-pro' }
    });
    expect(blob.del).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakesParticipant.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
  });

  it('stops at the limit and asks the next tier only for what is left', async () => {
    prismaMock.sweepstakes.findMany.mockResolvedValueOnce(ids('a'));

    await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW,
      limit: 3
    });

    expect(prismaMock.sweepstakes.findMany.mock.calls[1][0]?.take).toBe(2);
  });

  it('does not look at the next tier once the limit is reached', async () => {
    prismaMock.sweepstakes.findMany.mockResolvedValueOnce(ids('a', 'b'));

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW,
      limit: 2
    });

    expect(result.sweepstakes.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledTimes(1);
  });

  it('uses the current time by default', async () => {
    const before = Date.now();

    await runSweepstakesDataRetention(db, { mode: 'report' });

    const call = prismaMock.sweepstakes.findMany.mock.calls[0][0];
    const timing = call?.where?.timing as { endDate: { lt: Date } };
    expect(timing.endDate.lt.getTime()).toBeGreaterThanOrEqual(
      before - 90 * DAY
    );
    expect(timing.endDate.lt.getTime()).toBeLessThanOrEqual(
      Date.now() - 90 * DAY
    );
  });

  describe('the banner', () => {
    const BANNER = 'https://abc.public.blob.vercel-storage.com/banner.png';

    beforeEach(() => {
      prismaMock.sweepstakes.findMany
        .mockResolvedValueOnce(ids('sweep-1'))
        .mockResolvedValueOnce([]);
      prismaMock.sweepstakesDetails.findUnique.mockResolvedValue({
        banner: BANNER
      } as never);
      prismaMock.sweepstakesDetails.count.mockResolvedValue(0);
      prismaMock.template.count.mockResolvedValue(0);
      prismaMock.team.count.mockResolvedValue(0);
    });

    it('deletes an unused banner and clears it', async () => {
      const result = await runSweepstakesDataRetention(db, {
        mode: 'delete',
        now: NOW
      });

      expect(prismaMock.sweepstakesDetails.findUnique).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-1' },
        select: { banner: true }
      });
      expect(prismaMock.sweepstakesDetails.count).toHaveBeenCalledWith({
        where: { banner: BANNER, sweepstakesId: { not: 'sweep-1' } }
      });
      expect(prismaMock.template.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { image: BANNER },
            { content: { path: ['setup', 'banner'], equals: BANNER } }
          ]
        }
      });
      expect(prismaMock.team.count).toHaveBeenCalledWith({
        where: { logo: BANNER }
      });
      expect(blob.del).toHaveBeenCalledWith([BANNER]);
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: { dataDeletedAt: NOW, details: { update: { banner: null } } }
      });
      expect(result.sweepstakes[0].files).toBe(1);
    });

    it.each([
      ['another giveaway', 'sweepstakesDetails'],
      ['a template', 'template'],
      ['the logo of a team', 'team']
    ] as const)('keeps a banner that %s uses', async (_, model) => {
      prismaMock[model].count.mockResolvedValue(1);

      const result = await runSweepstakesDataRetention(db, {
        mode: 'delete',
        now: NOW
      });

      expect(blob.del).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: { dataDeletedAt: NOW }
      });
      expect(result.sweepstakes[0].files).toBe(0);
    });

    it('keeps the banner of a built-in template', async () => {
      prismaMock.sweepstakesDetails.findUnique.mockResolvedValue({
        banner: STATIC_TEMPLATES[0].setup.banner
      } as never);

      await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

      expect(blob.del).not.toHaveBeenCalled();
    });

    it('keeps the image of a built-in template', async () => {
      prismaMock.sweepstakesDetails.findUnique.mockResolvedValue({
        banner: STATIC_TEMPLATES[1].template.image
      } as never);

      await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

      expect(blob.del).not.toHaveBeenCalled();
    });

    it.each([
      ['an image that is not an upload', 'https://example.com/banner.png'],
      ['no banner', null]
    ])('deletes nothing for %s', async (_, banner) => {
      prismaMock.sweepstakesDetails.findUnique.mockResolvedValue({
        banner
      } as never);

      await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

      expect(blob.del).not.toHaveBeenCalled();
      expect(prismaMock.template.count).not.toHaveBeenCalled();
    });

    it('keeps the banner URL when the Blob token is missing', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: { dataDeletedAt: NOW }
      });
    });

    it('counts the banner in report mode', async () => {
      prismaMock.taskCompletion.count.mockResolvedValue(2);

      const result = await runSweepstakesDataRetention(db, {
        mode: 'report',
        now: NOW
      });

      expect(result.sweepstakes[0].files).toBe(3);
      expect(blob.del).not.toHaveBeenCalled();
    });

    it('does not count a banner in use in report mode', async () => {
      prismaMock.taskCompletion.count.mockResolvedValue(2);
      prismaMock.team.count.mockResolvedValue(1);

      const result = await runSweepstakesDataRetention(db, {
        mode: 'report',
        now: NOW
      });

      expect(result.sweepstakes[0].files).toBe(2);
    });
  });
});
