import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  bonusTask,
  createEntry,
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import deleteSweepstakes from '../delete-sweepstakes';

const createEnteredSweepstakes = async (teamId: string, userIds: string[]) => {
  const sweepstakes = await createSweepstakes({
    teamId,
    tasks: [bonusTask('First'), bonusTask('Second')]
  });
  const [prize] = sweepstakes.prizes;
  const taskIds = sweepstakes.tasks.map((task) => task.id);
  for (const userId of userIds) {
    const entry = await createEntry({
      sweepstakesId: sweepstakes.id,
      taskIds,
      userId
    });
    await db.taskProgress.create({
      data: { participantId: entry.id, taskId: taskIds[0], count: 1 }
    });
    await db.sweepstakesAllocation.create({
      data: { participantId: entry.id, prizeId: prize.id }
    });
  }
  const [completion] = await db.taskCompletion.findMany({
    where: { task: { sweepstakesId: sweepstakes.id } }
  });
  const draw = await db.prizeDraw.create({
    data: {
      id: `draw-${sweepstakes.id}`,
      prizeId: prize.id,
      taskCompletionId: completion.id,
      result: 'DISQUALIFIED'
    }
  });
  await db.prizeDraw.create({
    data: {
      id: `redraw-${sweepstakes.id}`,
      prizeId: prize.id,
      taskCompletionId: completion.id,
      previousDrawId: draw.id
    }
  });
  return sweepstakes;
};

const countRows = async (sweepstakesId: string) => ({
  sweepstakes: await db.sweepstakes.count({ where: { id: sweepstakesId } }),
  details: await db.sweepstakesDetails.count({ where: { sweepstakesId } }),
  timing: await db.sweepstakesTiming.count({ where: { sweepstakesId } }),
  visibility: await db.sweepstakesVisibility.count({
    where: { sweepstakesId }
  }),
  criteria: await db.sweepstakesWinnerCriteria.count({
    where: { sweepstakesId }
  }),
  prizes: await db.prize.count({ where: { sweepstakesId } }),
  tasks: await db.task.count({ where: { sweepstakesId } }),
  participants: await db.sweepstakesParticipant.count({
    where: { sweepstakesId }
  }),
  completions: await db.taskCompletion.count({
    where: { task: { sweepstakesId } }
  }),
  progress: await db.taskProgress.count({
    where: { task: { sweepstakesId } }
  }),
  allocations: await db.sweepstakesAllocation.count({
    where: { prize: { sweepstakesId } }
  }),
  draws: await db.prizeDraw.count({ where: { prize: { sweepstakesId } } })
});

const ENTERED_ROWS = {
  sweepstakes: 1,
  details: 1,
  timing: 1,
  visibility: 1,
  criteria: 1,
  prizes: 1,
  tasks: 2,
  participants: 2,
  completions: 4,
  progress: 2,
  allocations: 2,
  draws: 2
};

const NO_ROWS = Object.fromEntries(
  Object.keys(ENTERED_ROWS).map((table) => [table, 0])
);

const setup = async () => {
  const { user, team } = await createHost();
  const entrants = [await createUser(), await createUser()];
  const userIds = entrants.map((entrant) => entrant.id);
  const deleted = await createEnteredSweepstakes(team.id, userIds);
  const kept = await createEnteredSweepstakes(team.id, userIds);
  return { host: user, team, userIds, deleted, kept };
};

describe('deleteSweepstakes', () => {
  it('deletes the sweepstakes and every row that belongs to it', async () => {
    const { host, team, userIds, deleted } = await setup();
    expect(await countRows(deleted.id)).toEqual(ENTERED_ROWS);
    signIn({ id: host.id });

    expect(expectOk(await deleteSweepstakes({ id: deleted.id }))).toEqual({
      slug: team.slug
    });

    expect(await countRows(deleted.id)).toEqual(NO_ROWS);
    expect(await db.user.count({ where: { id: { in: userIds } } })).toBe(2);
    expect(await db.team.count({ where: { id: team.id } })).toBe(1);
  });

  it('keeps the other sweepstakes of the team and their entries', async () => {
    const { host, deleted, kept } = await setup();
    signIn({ id: host.id });

    expectOk(await deleteSweepstakes({ id: deleted.id }));

    expect(await countRows(kept.id)).toEqual(ENTERED_ROWS);
  });

  it('deletes nothing when the user may not delete sweepstakes', async () => {
    const { team, deleted } = await setup();
    const guest = await createUser();
    await db.membership.create({
      data: { userId: guest.id, teamId: team.id, role: 'GUEST' }
    });
    signIn({ id: guest.id });

    expectFailure(await deleteSweepstakes({ id: deleted.id }));

    expect(await countRows(deleted.id)).toEqual(ENTERED_ROWS);
  });
});
