import { describe, expect, it, vi } from 'vitest';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes,
  createUser,
  secretCodeTask
} from '@giveaway/testing-integration/fixtures';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import type { Prisma } from '@giveaway/db-model';
import submitTask from '../submit-tasks';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: vi.fn(),
  draftMode: vi.fn()
}));

const OPEN_AUDIENCE = {
  allowedIdentities: ['ANONYMOUS']
} satisfies Prisma.SweepstakesAudienceCreateWithoutSweepstakesInput;

const setup = async (
  audience: Prisma.SweepstakesAudienceCreateWithoutSweepstakesInput = OPEN_AUDIENCE
) => {
  const { team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    tasks: [secretCodeTask('good dog')]
  });
  await db.sweepstakesAudience.create({
    data: { ...audience, sweepstakes: { connect: { id: sweepstakes.id } } }
  });
  const participant = await createUser();
  signIn({ id: participant.id, accountType: 'PARTICIPANT' });
  const [task] = sweepstakes.tasks;
  const submit = () =>
    submitTask({
      sweepstakesId: sweepstakes.id,
      taskId: task.id,
      data: { code: 'Good Dog' }
    });
  return { sweepstakes, task, userId: participant.id, submit };
};

const findEntries = async (userId: string, taskId: string) => {
  const participants = await db.sweepstakesParticipant.findMany({
    where: { userId }
  });
  const completions = await db.taskCompletion.findMany({ where: { taskId } });
  const progress = await db.taskProgress.findMany({ where: { taskId } });
  return { participants, completions, progress };
};

describe('submitTask', () => {
  it('creates the participant, the completion and the attempt count', async () => {
    const { task, userId, submit } = await setup();

    expect(expectOk(await submit())).toBe(true);

    const { participants, completions, progress } = await findEntries(
      userId,
      task.id
    );
    expect(participants).toHaveLength(1);
    expect(completions).toEqual([
      expect.objectContaining({
        participantId: participants[0].id,
        status: 'COMPLETED'
      })
    ]);
    expect(progress).toEqual([
      expect.objectContaining({ participantId: participants[0].id, count: 1 })
    ]);
  });

  it('[ENTRY-001] rejects a second submission of the same task', async () => {
    const { task, userId, submit } = await setup();
    expectOk(await submit());

    const result = await submit();

    expect(result).toMatchObject({
      ok: false,
      data: { code: 'VALIDATION_ERROR' }
    });
    const { completions } = await findEntries(userId, task.id);
    expect(completions).toHaveLength(1);
  });

  it('keeps one participant and one attempt row when a new participant submits twice at the same time', async () => {
    const { task, userId, submit } = await setup();

    await holdTableWrites('Participant', { writers: 2 }, () =>
      Promise.all([submit(), submit()])
    );

    const { participants, completions, progress } = await findEntries(
      userId,
      task.id
    );
    expect(participants).toHaveLength(1);
    expect(completions).toHaveLength(1);
    expect(progress).toHaveLength(1);
  });

  describe('when a participant submits the same task twice at the same time', () => {
    const submitTwice = async () => {
      const entry = await setup();
      await db.sweepstakesParticipant.create({
        data: { userId: entry.userId, sweepstakesId: entry.sweepstakes.id }
      });
      await holdTableWrites('TaskCompletion', { writers: 2 }, () =>
        Promise.all([entry.submit(), entry.submit()])
      );
      return findEntries(entry.userId, entry.task.id);
    };

    it('counts both attempts in one attempt row', async () => {
      const { progress } = await submitTwice();

      expect(progress).toEqual([expect.objectContaining({ count: 2 })]);
    });

    it.fails(
      '[ENTRY-001] records one completion (fails until #261 is fixed)',
      async () => {
        const { completions } = await submitTwice();

        expect(completions).toHaveLength(1);
      }
    );
  });

  describe('when the audience of the giveaway does not include the participant', () => {
    const expectRefused = async (
      audience: Prisma.SweepstakesAudienceCreateWithoutSweepstakesInput,
      message: string
    ) => {
      const { task, userId, submit } = await setup(audience);

      expect(expectFailure(await submit(), 'FORBIDDEN').message).toBe(message);

      const { participants, completions } = await findEntries(userId, task.id);
      expect(participants).toEqual([]);
      expect(completions).toEqual([]);
    };

    it('refuses a participant outside the allowed regions', async () => {
      await expectRefused(
        {
          ...OPEN_AUDIENCE,
          regionalRestriction: {
            create: { regions: ['country:US'], filter: 'INCLUDE' }
          }
        },
        'You are not eligible to participate in this giveaway.'
      );
    });

    it('refuses a participant without an allowed account', async () => {
      await expectRefused(
        { allowedIdentities: ['DISCORD'] },
        'Connect one of the accounts that this giveaway accepts to enter it.'
      );
    });

    it('refuses a participant who has not confirmed the required age', async () => {
      await expectRefused(
        {
          ...OPEN_AUDIENCE,
          formFields: {
            create: {
              type: 'AGE',
              label: 'I am at least 18',
              required: true,
              minimum: 18
            }
          }
        },
        'Complete your profile to enter this giveaway.'
      );
    });

    it('refuses a participant who is not a member of the team of a private giveaway', async () => {
      const { sweepstakes, task, userId, submit } = await setup();
      await db.sweepstakesVisibility.update({
        where: { sweepstakesId: sweepstakes.id },
        data: { visibility: 'PRIVATE' }
      });

      expectFailure(await submit(), 'NOT_FOUND');

      const { completions } = await findEntries(userId, task.id);
      expect(completions).toEqual([]);
    });
  });
});
