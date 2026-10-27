import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  createEntry,
  createHost,
  createSweepstakes,
  nextId
} from '@giveaway/testing-integration/fixtures';
import { signIn } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import { deleteTaskCompletion } from '../delete-task-completion';

const setup = async () => {
  const { user, team } = await createHost();
  const sweepstakes = await createSweepstakes({ teamId: team.id });
  const [prize] = sweepstakes.prizes;
  const taskIds = sweepstakes.tasks.map((task) => task.id);
  const [rerolled, replacement, next] = await Promise.all([
    createEntry({ sweepstakesId: sweepstakes.id, taskIds }),
    createEntry({ sweepstakesId: sweepstakes.id, taskIds }),
    createEntry({ sweepstakesId: sweepstakes.id, taskIds })
  ]);
  const disqualified = await db.prizeDraw.create({
    data: {
      id: nextId('draw'),
      prizeId: prize.id,
      taskCompletionId: rerolled.taskCompletions[0].id,
      result: 'DISQUALIFIED',
      disqualificationReason: 'No reply'
    }
  });
  const winner = await db.prizeDraw.create({
    data: {
      id: nextId('draw'),
      prizeId: prize.id,
      taskCompletionId: replacement.taskCompletions[0].id,
      previousDrawId: disqualified.id
    }
  });
  signIn({ id: user.id });
  return { sweepstakes, prize, rerolled, replacement, next, winner };
};

describe('deleteTaskCompletion', () => {
  it('keeps the winner who replaced the deleted entry after a re-roll', async () => {
    const { sweepstakes, rerolled, winner } = await setup();

    expectOk(
      await deleteTaskCompletion({
        sweepstakesId: sweepstakes.id,
        taskCompletionId: rerolled.taskCompletions[0].id
      })
    );

    const draws = await db.prizeDraw.findMany({
      where: { prize: { sweepstakesId: sweepstakes.id } }
    });
    expect(draws).toEqual([
      expect.objectContaining({
        id: winner.id,
        result: 'WINNER',
        previousDrawId: null
      })
    ]);
  });

  it('keeps the rest of the chain when a draw in its middle is deleted', async () => {
    const { sweepstakes, prize, replacement, next, winner } = await setup();
    await db.prizeDraw.update({
      where: { id: winner.id },
      data: { result: 'DISQUALIFIED' }
    });
    const last = await db.prizeDraw.create({
      data: {
        id: nextId('draw'),
        prizeId: prize.id,
        taskCompletionId: next.taskCompletions[0].id,
        previousDrawId: winner.id
      }
    });

    expectOk(
      await deleteTaskCompletion({
        sweepstakesId: sweepstakes.id,
        taskCompletionId: replacement.taskCompletions[0].id
      })
    );

    const remaining = await db.prizeDraw.findUniqueOrThrow({
      where: { id: last.id }
    });
    expect(remaining).toMatchObject({ result: 'WINNER', previousDrawId: null });
    expect(
      await db.prizeDraw.count({
        where: { prize: { sweepstakesId: sweepstakes.id } }
      })
    ).toBe(2);
  });
});
