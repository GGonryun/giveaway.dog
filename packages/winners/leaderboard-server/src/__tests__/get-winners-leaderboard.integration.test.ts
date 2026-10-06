import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  createEntry,
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import { expectOk } from '@giveaway/testing-server/result';
import getWinnersLeaderboard from '../get-winners-leaderboard';

type Input = Parameters<typeof getWinnersLeaderboard>[0];

const leaderboard = async (input: Partial<NonNullable<Input>> = {}) =>
  expectOk(await getWinnersLeaderboard(input as Input));

const seed = async () => {
  const { team } = await createHost();
  const spring = await createSweepstakes({
    teamId: team.id,
    name: 'Spring giveaway',
    prizes: [
      { name: 'Keyboard', quota: 2 },
      { name: 'Mouse', quota: 1 }
    ]
  });
  const summer = await createSweepstakes({
    teamId: team.id,
    name: 'Summer giveaway',
    prizes: [{ name: 'Headset', quota: 2 }]
  });
  const hidden = await createSweepstakes({
    teamId: team.id,
    name: 'Hidden giveaway',
    visibility: 'UNLISTED',
    prizes: [{ name: 'Monitor', quota: 1 }]
  });

  const users = {
    alice: await createUser({ name: 'Alice Archer' }),
    bob: await createUser({ name: 'Bob Baker' }),
    carol: await createUser({ name: 'Carol Cook' }),
    dave: await createUser({ name: 'Dave Diaz' }),
    erin: await createUser({ name: 'Erin Ellis' })
  };

  const draw = async (
    sweepstakes: Awaited<ReturnType<typeof createSweepstakes>>,
    prizeIndex: number,
    userId: string,
    result: 'WINNER' | 'DISQUALIFIED' = 'WINNER'
  ) => {
    const entry =
      (await db.sweepstakesParticipant.findUnique({
        where: {
          userId_sweepstakesId: { userId, sweepstakesId: sweepstakes.id }
        },
        include: { taskCompletions: true }
      })) ??
      (await createEntry({
        sweepstakesId: sweepstakes.id,
        taskIds: [sweepstakes.tasks[0].id],
        userId
      }));
    await db.prizeDraw.create({
      data: {
        id: `draw-${sweepstakes.id}-${prizeIndex}-${userId}`,
        prizeId: sweepstakes.prizes[prizeIndex].id,
        taskCompletionId: entry.taskCompletions[0].id,
        result
      }
    });
  };

  await draw(spring, 0, users.alice.id);
  await draw(spring, 1, users.alice.id);
  await draw(summer, 0, users.alice.id);
  await draw(spring, 0, users.bob.id);
  await draw(summer, 0, users.bob.id, 'DISQUALIFIED');
  await draw(summer, 0, users.erin.id);
  await draw(hidden, 0, users.carol.id);
  await draw(spring, 0, users.dave.id, 'DISQUALIFIED');

  return { team, spring, summer, users };
};

describe('getWinnersLeaderboard', () => {
  it('ranks the winners of public giveaways by their number of wins', async () => {
    const { users } = await seed();

    const rows = await leaderboard();

    const [bob, erin] = [users.bob, users.erin].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    expect(
      rows.map(({ userId, userName, winCount }) => ({
        userId,
        userName,
        winCount
      }))
    ).toEqual([
      { userId: users.alice.id, userName: 'Alice Archer', winCount: 3 },
      { userId: bob.id, userName: bob.name, winCount: 1 },
      { userId: erin.id, userName: erin.name, winCount: 1 }
    ]);
  });

  it('lists each public win with its giveaway, team and prize', async () => {
    const { team, spring, summer, users } = await seed();

    const [alice] = await leaderboard({ limit: 1 });

    expect(alice.userId).toBe(users.alice.id);
    expect(alice.wins).toHaveLength(3);
    expect(alice.wins).toEqual(
      expect.arrayContaining([
        {
          sweepstakesId: spring.id,
          sweepstakesName: 'Spring giveaway',
          sweepstakesSlug: spring.id,
          teamSlug: team.slug,
          prizeName: 'Keyboard',
          wonAt: expect.any(Date)
        },
        expect.objectContaining({
          sweepstakesId: spring.id,
          prizeName: 'Mouse'
        }),
        expect.objectContaining({
          sweepstakesId: summer.id,
          sweepstakesName: 'Summer giveaway',
          prizeName: 'Headset'
        })
      ])
    );
  });

  it('pages through the ranking', async () => {
    const { users } = await seed();

    const first = await leaderboard({ page: 1, limit: 2 });
    const second = await leaderboard({ page: 2, limit: 2 });
    const third = await leaderboard({ page: 3, limit: 2 });

    expect(first.map((row) => row.userId)[0]).toBe(users.alice.id);
    expect([...first, ...second].map((row) => row.userId).sort()).toEqual(
      [users.alice.id, users.bob.id, users.erin.id].sort()
    );
    expect(second).toHaveLength(1);
    expect(third).toEqual([]);
  });

  it('searches the names of the winners without regard to case', async () => {
    const { users } = await seed();

    const rows = await leaderboard({ search: '  bAKer ' });

    expect(rows.map((row) => row.userId)).toEqual([users.bob.id]);
  });

  it('returns no rows when nobody won a public giveaway', async () => {
    await createHost();

    expect(await leaderboard()).toEqual([]);
  });

  it('does not send the email addresses of the winners', async () => {
    await seed();

    const rows = await leaderboard();

    expect(rows).not.toHaveLength(0);
    for (const row of rows) {
      expect(row).not.toHaveProperty('userEmail');
    }
  });
});
