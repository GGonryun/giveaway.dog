import { beforeEach, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { runXPickerDataRetention } from '../run-data-retention';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const db = prismaMock as unknown as PrismaClient;

const FREE_CUTOFF = new Date(NOW.getTime() - 90 * DAY);
const PRO_CUTOFF = new Date(NOW.getTime() - 365 * DAY);

const where = (extra: object) => ({
  dataDeletedAt: null,
  status: 'COMPLETE',
  ...extra
});

const ids = (...values: string[]) => values.map((id) => ({ id }));

describe('runXPickerDataRetention', () => {
  beforeEach(() => {
    prismaMock.twitterPicker.findMany.mockResolvedValue([]);
    prismaMock.twitterPickerUser.findMany.mockResolvedValue([]);
    prismaMock.twitterPost.findMany.mockResolvedValue([]);
    prismaMock.twitterPickerUser.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.twitterPost.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.twitterPickerUser.count.mockResolvedValue(7);
    prismaMock.twitterPost.count.mockResolvedValue(3);
  });

  it('finds 5 completed X pickers of each retained tier past its cutoff, oldest first', async () => {
    await runXPickerDataRetention(db, { mode: 'delete', now: NOW });

    expect(prismaMock.twitterPicker.findMany.mock.calls).toEqual([
      [
        {
          where: where({
            updatedAt: { lt: FREE_CUTOFF },
            OR: [{ teamId: null }, { team: { tier: 'FREE' } }]
          }),
          select: { id: true },
          orderBy: { updatedAt: 'asc' },
          take: 5
        }
      ],
      [
        {
          where: where({
            updatedAt: { lt: PRO_CUTOFF },
            team: { tier: 'PRO' }
          }),
          select: { id: true },
          orderBy: { updatedAt: 'asc' },
          take: 5
        }
      ]
    ]);
  });

  it('deletes the undrawn users and the posts 500 at a time, then marks the X picker', async () => {
    prismaMock.twitterPicker.findMany
      .mockResolvedValueOnce(ids('picker-free'))
      .mockResolvedValueOnce([]);
    prismaMock.twitterPickerUser.findMany
      .mockResolvedValueOnce(ids('u1', 'u2'))
      .mockResolvedValueOnce(ids('u3'))
      .mockResolvedValueOnce([]);
    prismaMock.twitterPickerUser.deleteMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    prismaMock.twitterPost.findMany
      .mockResolvedValueOnce(ids('p1'))
      .mockResolvedValueOnce([]);
    prismaMock.twitterPost.deleteMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const result = await runXPickerDataRetention(db, {
      mode: 'delete',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'delete',
      pickers: [{ id: 'picker-free', tier: 'FREE', users: 3, posts: 1 }]
    });
    expect(prismaMock.twitterPickerUser.findMany).toHaveBeenCalledWith({
      where: { pickerId: 'picker-free', draws: { none: {} } },
      select: { id: true },
      take: 500
    });
    expect(prismaMock.twitterPickerUser.deleteMany.mock.calls[0][0]).toEqual({
      where: { id: { in: ['u1', 'u2'] } }
    });
    expect(prismaMock.twitterPickerUser.deleteMany.mock.calls[1][0]).toEqual({
      where: { id: { in: ['u3'] } }
    });
    expect(prismaMock.twitterPost.findMany).toHaveBeenCalledWith({
      where: { pickerId: 'picker-free' },
      select: { id: true },
      take: 500
    });
    expect(prismaMock.twitterPost.deleteMany.mock.calls[0][0]).toEqual({
      where: { id: { in: ['p1'] } }
    });
    expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
      where: { id: 'picker-free' },
      data: { dataDeletedAt: NOW }
    });
  });

  it('stops at the limit and does not look at the next tier', async () => {
    prismaMock.twitterPicker.findMany.mockResolvedValueOnce(ids('a', 'b'));

    const result = await runXPickerDataRetention(db, {
      mode: 'delete',
      now: NOW,
      limit: 2
    });

    expect(result.pickers.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(prismaMock.twitterPicker.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.twitterPicker.findMany.mock.calls[0][0]?.take).toBe(2);
  });

  it('asks the next tier only for what is left under the limit', async () => {
    prismaMock.twitterPicker.findMany.mockResolvedValueOnce(ids('a'));

    await runXPickerDataRetention(db, { mode: 'delete', now: NOW, limit: 3 });

    expect(prismaMock.twitterPicker.findMany.mock.calls[1][0]?.take).toBe(2);
  });

  it('only counts the rows in report mode', async () => {
    prismaMock.twitterPicker.findMany.mockResolvedValueOnce(ids('a'));

    const result = await runXPickerDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'report',
      pickers: [{ id: 'a', tier: 'FREE', users: 7, posts: 3 }]
    });
    expect(prismaMock.twitterPickerUser.count).toHaveBeenCalledWith({
      where: { pickerId: 'a', draws: { none: {} } }
    });
    expect(prismaMock.twitterPost.count).toHaveBeenCalledWith({
      where: { pickerId: 'a' }
    });
    expect(prismaMock.twitterPickerUser.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.twitterPost.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
  });

  it('uses the current time by default', async () => {
    const before = Date.now();

    await runXPickerDataRetention(db, { mode: 'report' });

    const call = prismaMock.twitterPicker.findMany.mock.calls[0][0];
    const cutoff = (call?.where?.updatedAt as { lt: Date }).lt.getTime();
    expect(cutoff).toBeGreaterThanOrEqual(before - 90 * DAY);
    expect(cutoff).toBeLessThanOrEqual(Date.now() - 90 * DAY);
  });
});
