import { describe, expect, it } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
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
  const host = await createHost();
  const sweepstakes = await createSweepstakes({ teamId: host.team.id });
  const [task] = sweepstakes.tasks;
  const entry = await createEntry({
    sweepstakesId: sweepstakes.id,
    taskIds: [task.id]
  });
  signIn({ id: host.user.id });
  return { host, sweepstakes, task, entry };
};

describe('getSweepstakeTaskEntries', () => {
  it('returns the completions of a task of the sweepstakes', async () => {
    const { host, sweepstakes, task, entry } = await setup();

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: host.team.slug,
      taskId: task.id
    });

    expect(expectOk(result).map((completion) => completion.id)).toEqual(
      entry.taskCompletions.map((completion) => completion.id)
    );
  });

  it('returns nothing for a task of a sweepstakes of another team', async () => {
    const { host, sweepstakes } = await setup();
    const other = await createHost();
    const otherSweepstakes = await createSweepstakes({
      teamId: other.team.id
    });
    const [otherTask] = otherSweepstakes.tasks;
    await createEntry({
      sweepstakesId: otherSweepstakes.id,
      taskIds: [otherTask.id]
    });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: host.team.slug,
      taskId: otherTask.id
    });

    expect(expectOk(result)).toEqual([]);
  });

  it('returns nothing for a task of another sweepstakes of the same team', async () => {
    const { host, sweepstakes } = await setup();
    const sibling = await createSweepstakes({ teamId: host.team.id });
    const [siblingTask] = sibling.tasks;
    await createEntry({
      sweepstakesId: sibling.id,
      taskIds: [siblingTask.id]
    });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: host.team.slug,
      taskId: siblingTask.id
    });

    expect(expectOk(result)).toEqual([]);
  });

  it('returns NOT_FOUND to a host who is not a member of the team', async () => {
    const { host, sweepstakes, task } = await setup();
    const outsider = await createHost();
    signIn({ id: outsider.user.id });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: host.team.slug,
      taskId: task.id
    });

    expectFailure(result, 'NOT_FOUND');
  });

  it('returns NOT_FOUND when the slug names another team of the caller', async () => {
    const { host, sweepstakes, task } = await setup();
    const other = await createHost();
    await db.membership.create({
      data: {
        teamId: other.team.id,
        userId: host.user.id,
        role: TeamRole.OWNER
      }
    });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: other.team.slug,
      taskId: task.id
    });

    expectFailure(result, 'NOT_FOUND');
  });

  it('returns FORBIDDEN to a blocked member', async () => {
    const { host, sweepstakes, task } = await setup();
    const blocked = await createUser({ accountType: 'HOST' });
    await db.membership.create({
      data: { teamId: host.team.id, userId: blocked.id, role: TeamRole.BLOCKED }
    });
    signIn({ id: blocked.id });

    const result = await getSweepstakeTaskEntries({
      sweepstakesId: sweepstakes.id,
      slug: host.team.slug,
      taskId: task.id
    });

    expectFailure(result, 'FORBIDDEN');
  });
});
