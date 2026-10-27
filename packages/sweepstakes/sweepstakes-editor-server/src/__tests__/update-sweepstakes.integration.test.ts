import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  bonusTask,
  createEntry,
  createHost,
  createSweepstakes,
  secretCodeTask
} from '@giveaway/testing-integration/fixtures';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { toSweepstakesInput } from '@giveaway/sweepstakes-model/input';
import { signIn } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import updateSweepstakes from '../update-sweepstakes';

const DAY = 24 * 60 * 60 * 1000;

const setup = async () => {
  const { user, team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    prizes: [{ name: 'Golden Bone', quota: 2 }],
    tasks: [bonusTask('Bonus'), secretCodeTask('BONE')]
  });
  const [prize] = sweepstakes.prizes;
  const taskIds = sweepstakes.tasks.map((task) => task.id);
  const entries = [];
  for (let i = 0; i < 3; i++) {
    entries.push(
      await createEntry({
        sweepstakesId: sweepstakes.id,
        taskIds: [taskIds[0]]
      })
    );
  }
  const [first, second, third] = entries.map(
    (entry) => entry.taskCompletions[0].id
  );
  const disqualified = await db.prizeDraw.create({
    data: {
      id: `disqualified-${sweepstakes.id}`,
      prizeId: prize.id,
      taskCompletionId: first,
      result: 'DISQUALIFIED',
      disqualificationReason: 'No reply'
    }
  });
  await db.prizeDraw.create({
    data: {
      id: `reroll-${sweepstakes.id}`,
      prizeId: prize.id,
      taskCompletionId: second,
      previousDrawId: disqualified.id
    }
  });
  await db.prizeDraw.create({
    data: {
      id: `winner-${sweepstakes.id}`,
      prizeId: prize.id,
      taskCompletionId: third
    }
  });
  await db.taskProgress.create({
    data: { participantId: entries[0].id, taskId: taskIds[1], count: 2 }
  });
  return { host: user, sweepstakes };
};

const readInput = async (id: string) => ({
  ...toSweepstakesInput(
    await db.sweepstakes.findUniqueOrThrow({
      where: { id },
      include: FORM_SWEEPSTAKES_PAYLOAD
    })
  ),
  id
});

const readDraws = (sweepstakesId: string) =>
  db.prizeDraw.findMany({
    where: { prize: { sweepstakesId } },
    orderBy: { id: 'asc' }
  });

const readProgress = (sweepstakesId: string) =>
  db.taskProgress.findMany({
    where: { task: { sweepstakesId } },
    orderBy: { id: 'asc' }
  });

describe('updateSweepstakes', () => {
  it('[EDIT-002] keeps the winners, the disqualified draws and each re-roll chain', async () => {
    const { host, sweepstakes } = await setup();
    const before = await readDraws(sweepstakes.id);
    const input = await readInput(sweepstakes.id);
    signIn({ id: host.id });

    expectOk(
      await updateSweepstakes({
        ...input,
        timing: {
          ...input.timing,
          endDate: new Date(Date.now() + 3 * DAY)
        }
      })
    );

    expect(await readDraws(sweepstakes.id)).toEqual(before);
  });

  it("[EDIT-003] keeps each participant's progress on its tasks", async () => {
    const { host, sweepstakes } = await setup();
    const before = await readProgress(sweepstakes.id);
    signIn({ id: host.id });

    expectOk(await updateSweepstakes(await readInput(sweepstakes.id)));

    expect(await readProgress(sweepstakes.id)).toEqual(before);
  });

  it('[EDIT-005] keeps the creation date of the giveaway', async () => {
    const { host, sweepstakes } = await setup();
    const createdAt = new Date(Date.now() - 7 * DAY);
    await db.sweepstakes.update({
      where: { id: sweepstakes.id },
      data: { createdAt }
    });
    const input = await readInput(sweepstakes.id);
    signIn({ id: host.id });

    expectOk(
      await updateSweepstakes({
        ...input,
        setup: { ...input.setup, name: 'Renamed' }
      })
    );

    expect(
      await db.sweepstakes.findUniqueOrThrow({
        where: { id: sweepstakes.id },
        select: { createdAt: true }
      })
    ).toEqual({ createdAt });
  });

  it('drops the draws and progress of a removed task', async () => {
    const { host, sweepstakes } = await setup();
    const input = await readInput(sweepstakes.id);
    signIn({ id: host.id });

    expectOk(
      await updateSweepstakes({ ...input, tasks: input.tasks?.slice(1) })
    );

    expect(await readDraws(sweepstakes.id)).toEqual([]);
    expect(await readProgress(sweepstakes.id)).toHaveLength(1);
  });
});
