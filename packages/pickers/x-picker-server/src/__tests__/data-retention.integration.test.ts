import { describe, expect, it } from 'vitest';
import type { PickerStatus, TeamTier } from '@giveaway/db-model';
import { db } from '@giveaway/testing-integration/database';
import { createHost, nextId } from '@giveaway/testing-integration/fixtures';
import { runXPickerDataRetention } from '../run-data-retention';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const daysAgo = (days: number, ms = 0) =>
  new Date(NOW.getTime() - days * DAY - ms);

const createPicker = async ({
  tier = 'FREE',
  teamless = false,
  completedDaysAgo,
  completedMsAgo = 0,
  status = 'COMPLETE'
}: {
  tier?: TeamTier;
  teamless?: boolean;
  completedDaysAgo: number;
  completedMsAgo?: number;
  status?: PickerStatus;
}) => {
  let teamId: string | null = null;
  if (!teamless) {
    const { team } = await createHost();
    await db.team.update({ where: { id: team.id }, data: { tier } });
    teamId = team.id;
  }
  const picker = await db.twitterPicker.create({
    data: {
      teamId,
      status,
      winners: 1,
      minFollowersCount: 10,
      tweetUrls: ['https://x.com/e2e/status/1'],
      tweets: {
        create: [{ tweetId: '1', createdAt: daysAgo(200), text: 'hello' }]
      },
      users: {
        create: ['winner', 'other', 'third'].map((username) => ({
          userId: nextId('x-user'),
          username
        }))
      }
    },
    include: { users: true }
  });
  const winner = picker.users.find((user) => user.username === 'winner')!;
  await db.twitterPickerDraw.create({
    data: { pickerId: picker.id, userId: winner.id }
  });
  await db.$executeRaw`UPDATE "TwitterPicker" SET "updatedAt" = ${daysAgo(
    completedDaysAgo,
    completedMsAgo
  )} WHERE "id" = ${picker.id}`;
  return { picker, winner };
};

const usersOf = async (pickerId: string) =>
  (
    await db.twitterPickerUser.findMany({
      where: { pickerId },
      select: { username: true }
    })
  ).map(({ username }) => username);

const postsOf = (pickerId: string) =>
  db.twitterPost.count({ where: { pickerId } });

const run = () => runXPickerDataRetention(db, { mode: 'delete', now: NOW });

describe('the data retention of the X pickers of each team tier', () => {
  it('[RETAIN-008] deletes the scraped users and posts of a Free or teamless X picker 90 days after it completes, except the drawn users', async () => {
    const free = await createPicker({
      completedDaysAgo: 90,
      completedMsAgo: 1
    });
    const teamless = await createPicker({
      teamless: true,
      completedDaysAgo: 120
    });

    const result = await run();

    expect(result.pickers).toEqual(
      expect.arrayContaining([
        { id: free.picker.id, tier: 'FREE', users: 2, posts: 1 },
        { id: teamless.picker.id, tier: 'FREE', users: 2, posts: 1 }
      ])
    );
    for (const { picker } of [free, teamless]) {
      expect(await usersOf(picker.id)).toEqual(['winner']);
      expect(await postsOf(picker.id)).toBe(0);
    }
  });

  it('[RETAIN-009] keeps the data of a Pro X picker for one year, and of an Elite or Alpha X picker for good', async () => {
    const proKept = await createPicker({ tier: 'PRO', completedDaysAgo: 364 });
    const proExpired = await createPicker({
      tier: 'PRO',
      completedDaysAgo: 365,
      completedMsAgo: 1
    });
    const elite = await createPicker({
      tier: 'ELITE',
      completedDaysAgo: 3000
    });
    const alpha = await createPicker({
      tier: 'ALPHA',
      completedDaysAgo: 3000
    });

    const result = await run();

    expect(result.pickers.map(({ id }) => id)).toEqual([proExpired.picker.id]);
    expect(await usersOf(proExpired.picker.id)).toEqual(['winner']);
    for (const { picker } of [proKept, elite, alpha]) {
      expect(await usersOf(picker.id)).toHaveLength(3);
      expect(await postsOf(picker.id)).toBe(1);
    }
  });

  it('[RETAIN-010] keeps the X picker, its filters and its draws', async () => {
    const { picker, winner } = await createPicker({ completedDaysAgo: 100 });

    await run();

    const saved = await db.twitterPicker.findUniqueOrThrow({
      where: { id: picker.id },
      include: { draws: true }
    });
    expect(saved.minFollowersCount).toBe(10);
    expect(saved.tweetUrls).toEqual(['https://x.com/e2e/status/1']);
    expect(saved.status).toBe('COMPLETE');
    expect(saved.draws.map(({ userId }) => userId)).toEqual([winner.id]);
    expect(saved.dataDeletedAt).toEqual(NOW);
  });

  it('[RETAIN-011] deletes no data of an X picker before the retention period of its team tier ends', async () => {
    const free = await createPicker({ completedDaysAgo: 90 });
    const pro = await createPicker({ tier: 'PRO', completedDaysAgo: 365 });
    const processing = await createPicker({
      completedDaysAgo: 400,
      status: 'PROCESSING'
    });

    const result = await run();

    expect(result.pickers).toEqual([]);
    for (const { picker } of [free, pro, processing]) {
      expect(await usersOf(picker.id)).toHaveLength(3);
      expect(await postsOf(picker.id)).toBe(1);
    }
  });

  it('only counts the data in report mode', async () => {
    const { picker } = await createPicker({ completedDaysAgo: 100 });

    const result = await runXPickerDataRetention(db, {
      mode: 'report',
      now: NOW
    });

    expect(result).toEqual({
      mode: 'report',
      pickers: [{ id: picker.id, tier: 'FREE', users: 2, posts: 1 }]
    });
    expect(await usersOf(picker.id)).toHaveLength(3);
  });

  it('skips an X picker whose data was already deleted', async () => {
    const { picker } = await createPicker({ completedDaysAgo: 100 });
    await run();

    const result = await runXPickerDataRetention(db, {
      mode: 'delete',
      now: new Date(NOW.getTime() + DAY)
    });

    expect(result.pickers).toEqual([]);
    expect(await usersOf(picker.id)).toEqual(['winner']);
  });
});
