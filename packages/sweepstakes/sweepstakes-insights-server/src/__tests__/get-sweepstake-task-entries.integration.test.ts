import { describe, expect, it } from 'vitest';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { db } from '@giveaway/testing-integration/database';
import {
  createEntry,
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import getSweepstakeTaskEntries from '../get-sweepstake-task-entries';

const setup = async () => {
  const { user, team } = await createHost();
  const own = await createSweepstakes({ teamId: team.id });
  const other = await createHost();
  const foreign = await createSweepstakes({ teamId: other.team.id });
  await createEntry({ sweepstakesId: own.id, taskIds: [own.tasks[0].id] });
  await createEntry({
    sweepstakesId: foreign.id,
    taskIds: [foreign.tasks[0].id]
  });
  signIn({ id: user.id });
  return { team, own, foreign };
};

describe('getSweepstakeTaskEntries', () => {
  it('returns the entries of a task of the sweepstakes', async () => {
    const { team, own } = await setup();

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: own.id,
      slug: team.slug,
      taskId: own.tasks[0].id
    });

    expect(expectOk(result)).toHaveLength(1);
  });

  it('returns nothing for a task of another sweepstakes', async () => {
    const { team, own, foreign } = await setup();

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: own.id,
      slug: team.slug,
      taskId: foreign.tasks[0].id
    });

    expect(expectOk(result)).toEqual([]);
  });

  it('returns NOT_FOUND for a sweepstakes of a team the caller is not a member of', async () => {
    const { team, foreign } = await setup();

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: foreign.id,
      slug: team.slug,
      taskId: foreign.tasks[0].id
    });

    expectFailure(result, 'NOT_FOUND');
  });

  it('returns FORBIDDEN to a blocked member of the team', async () => {
    const { team, own } = await setup();
    const blocked = await createUser({ accountType: 'HOST' });
    await db.membership.create({
      data: { teamId: team.id, userId: blocked.id, role: 'BLOCKED' }
    });
    signIn({ id: blocked.id });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: own.id,
      slug: team.slug,
      taskId: own.tasks[0].id
    });

    expectFailure(result, 'FORBIDDEN');
  });
});
