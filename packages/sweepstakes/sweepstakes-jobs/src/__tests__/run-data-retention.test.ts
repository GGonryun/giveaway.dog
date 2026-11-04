import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { runSweepstakesDataRetention } from '../run-data-retention';

const blob = vi.hoisted(() => ({ del: vi.fn() }));
vi.mock('@vercel/blob', () => blob);

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = prismaMock as unknown as PrismaClient;

const FREE_CUTOFF = new Date(NOW.getTime() - 90 * DAY);
const PRO_CUTOFF = new Date(NOW.getTime() - 365 * DAY);
const MEDIA = 'https://abc.public.blob.vercel-storage.com/media.png';

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

describe('runSweepstakesDataRetention', () => {
  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token');
    blob.del.mockReset();
    blob.del.mockResolvedValue(undefined);
    prismaMock.sweepstakes.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(5);
    prismaMock.taskCompletion.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesJob.count.mockResolvedValue(1);
    prismaMock.taskJob.count.mockResolvedValue(2);
    prismaMock.automatedPostJob.count.mockResolvedValue(3);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('finds the ended giveaways of each retained tier past its cutoff, oldest first', async () => {
    await runSweepstakesDataRetention(db, { mode: 'delete', now: NOW });

    expect(prismaMock.sweepstakes.findMany.mock.calls).toEqual([
      [
        {
          where: ended(FREE_CUTOFF, {
            OR: [{ teamId: null }, { team: { tier: 'FREE' } }]
          }),
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          take: 20
        }
      ],
      [
        {
          where: ended(PRO_CUTOFF, { team: { tier: 'PRO' } }),
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          take: 20
        }
      ]
    ]);
  });

  it('deletes the uploads, the participants without a draw and the jobs, then marks the giveaway', async () => {
    prismaMock.sweepstakes.findMany
      .mockResolvedValueOnce([{ id: 'sweep-free' }])
      .mockResolvedValueOnce([]);
    prismaMock.taskCompletion.findMany.mockResolvedValue([
      { id: 'c1', proof: { mediaUrl: MEDIA } },
      { id: 'c2', proof: { mediaUrl: 42 } },
      { id: 'c3', proof: ['x'] },
      { id: 'c4', proof: null }
    ] as never);

    const result = await runSweepstakesDataRetention(db, {
      mode: 'delete',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'delete',
      sweepstakes: [
        { id: 'sweep-free', tier: 'FREE', participants: 5, files: 1, jobs: 6 }
      ]
    });
    expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
      where: deletable('sweep-free')
    });
    expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
      where: {
        participant: deletable('sweep-free'),
        task: { config: { path: ['type'], equals: 'SUBMIT_MEDIA' } }
      },
      select: { id: true, proof: true },
      orderBy: { id: 'asc' },
      take: 1000
    });
    expect(prismaMock.sweepstakesJob.count).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-free' }
    });
    expect(prismaMock.taskJob.count).toHaveBeenCalledWith({
      where: { task: { sweepstakesId: 'sweep-free' } }
    });
    expect(prismaMock.automatedPostJob.count).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-free' }
    });
    expect(blob.del).toHaveBeenCalledWith([MEDIA]);
    expect(prismaMock.sweepstakesParticipant.deleteMany).toHaveBeenCalledWith({
      where: deletable('sweep-free')
    });
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

  it('pages through the media completions', async () => {
    prismaMock.sweepstakes.findMany.mockResolvedValueOnce([{ id: 's' }]);
    const page = (from: number, size: number) =>
      Array.from({ length: size }, (_, index) => ({
        id: `c${from + index}`,
        proof: {
          mediaUrl: `https://abc.public.blob.vercel-storage.com/${from + index}.png`
        }
      }));
    prismaMock.taskCompletion.findMany
      .mockResolvedValueOnce(page(0, 1000) as never)
      .mockResolvedValueOnce(page(1000, 1) as never);

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result.sweepstakes[0].files).toBe(1001);
    expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.taskCompletion.findMany.mock.calls[1][0]).toMatchObject({
      cursor: { id: 'c999' },
      skip: 1
    });
  });

  it('counts each uploaded file once in report mode and changes nothing', async () => {
    prismaMock.sweepstakes.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'sweep-pro' }]);
    prismaMock.taskCompletion.findMany.mockResolvedValue([
      { id: 'c1', proof: { mediaUrl: MEDIA } },
      { id: 'c2', proof: { mediaUrl: MEDIA } },
      { id: 'c3', proof: { mediaUrl: 'https://example.com/x.png' } },
      { id: 'c4', proof: { mediaUrl: 42 } }
    ] as never);

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'report',
      sweepstakes: [
        { id: 'sweep-pro', tier: 'PRO', participants: 5, files: 1, jobs: 6 }
      ]
    });
    expect(blob.del).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakesParticipant.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
  });

  it('stops at the limit and asks the next tier only for what is left', async () => {
    prismaMock.sweepstakes.findMany.mockResolvedValueOnce([{ id: 'a' }]);

    await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW,
      limit: 3
    });

    expect(prismaMock.sweepstakes.findMany.mock.calls[1][0]?.take).toBe(2);
  });

  it('does not look at the next tier once the limit is reached', async () => {
    prismaMock.sweepstakes.findMany.mockResolvedValueOnce([
      { id: 'a' },
      { id: 'b' }
    ]);

    const result = await runSweepstakesDataRetention(db, {
      mode: 'report',
      now: NOW,
      limit: 2
    });

    expect(result.sweepstakes.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledTimes(1);
  });

  it('uses the current time and a limit of 20 by default', async () => {
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
    expect(call?.take).toBe(20);
  });
});
