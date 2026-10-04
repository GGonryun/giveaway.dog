import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { Prisma } from '@prisma/client';
import type { Sweepstakes, SweepstakesTiming } from '@prisma/client';
import submitTask from '../submit-tasks';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, signOut, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  buildSweepstakes,
  buildTiming,
  taskConfig,
  toJsonConfig
} from '@giveaway/task-model/testing/fixtures-task-procedures-verification';

const m = vi.hoisted(() => ({
  referralCode: null as string | null,
  cookies: vi.fn(),
  deleteCookie: vi.fn()
}));

vi.mock('next/headers', () => ({
  cookies: m.cookies,
  headers: vi.fn(),
  draftMode: vi.fn()
}));

vi.mock('cookies-next', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: m.deleteCookie
}));

const NOW = new Date('2026-10-01T12:00:00.000Z');

const storedTask = (
  id: string,
  config: object,
  sweepstakes: Partial<Sweepstakes> = {},
  timing: SweepstakesTiming | null = buildTiming()
) => ({
  id,
  sweepstakesId: 'sweep-1',
  index: 0,
  config: toJsonConfig(config),
  sweepstakes: { ...buildSweepstakes(sweepstakes), timing, visibility: null }
});

const participant = {
  id: 'participant-1',
  userId: TEST_USER.id,
  sweepstakesId: 'sweep-1',
  createdAt: NOW,
  updatedAt: NOW
};

const completion = (taskId: string, id = `completion-${taskId}`) => ({
  id,
  participantId: 'participant-1',
  taskId,
  completedAt: NOW,
  proof: null,
  reason: null,
  status: 'COMPLETED'
});

const input = (overrides: Partial<Parameters<typeof submitTask>[0]> = {}) => ({
  taskId: 'task-1',
  sweepstakesId: 'sweep-1',
  ...overrides
});

const givenTasks = (...tasks: ReturnType<typeof storedTask>[]) =>
  prismaMock.task.findMany.mockResolvedValue(tasks);

const givenCompletions = (...completions: ReturnType<typeof completion>[]) =>
  prismaMock.taskCompletion.findMany.mockResolvedValue(completions);

describe('submitTask', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    m.referralCode = null;
    m.cookies.mockReset();
    m.cookies.mockImplementation(async () => ({
      get: (name: string) =>
        name === 'referral_code' && m.referralCode
          ? { name, value: m.referralCode }
          : undefined
    }));
    m.deleteCookie.mockReset();
    signIn();
    givenTasks(storedTask('task-1', taskConfig('BONUS_TASK')));
    prismaMock.sweepstakesParticipant.upsert.mockResolvedValue(participant);
    givenCompletions();
    prismaMock.taskCompletion.create.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      signOut();

      const result = await submitTask(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it.each([
      ['a missing sweepstakes id', { taskId: 'task-1' }],
      ['a numeric task id', { taskId: 1, sweepstakesId: 'sweep-1' }]
    ])('rejects input with %s', async (_label, invalid) => {
      const result = await submitTask(
        invalid as unknown as Parameters<typeof submitTask>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('loading the task', () => {
    it('loads every task of the sweepstakes with timing and visibility', async () => {
      await submitTask(input());

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-1' },
        include: {
          sweepstakes: { include: { timing: true, visibility: true } }
        }
      });
    });

    it('returns NOT_FOUND when the task is not part of the sweepstakes', async () => {
      const result = await submitTask(input({ taskId: 'task-404' }));

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
      );
      expect(prismaMock.sweepstakesParticipant.upsert).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the giveaway timing is missing', async () => {
      givenTasks(storedTask('task-1', taskConfig('BONUS_TASK'), {}, null));

      const result = await submitTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Giveaway timing data is missing. Please contact support.'
      );
    });

    it('returns FORBIDDEN when the giveaway is still a draft', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('BONUS_TASK'), { status: 'DRAFT' })
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This giveaway has not been published yet.'
      );
      expect(prismaMock.sweepstakesParticipant.upsert).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the giveaway has ended', async () => {
      givenTasks(
        storedTask(
          'task-1',
          taskConfig('BONUS_TASK'),
          {},
          buildTiming({ endDate: new Date(NOW.getTime() - 1) })
        )
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This giveaway has ended and is no longer accepting entries.'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the giveaway has no team', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('BONUS_TASK'), { teamId: null })
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Giveaway team data is missing. Please contact support.'
      );
      expect(prismaMock.sweepstakesParticipant.upsert).not.toHaveBeenCalled();
    });
  });

  describe('registering the participant', () => {
    it('upserts the participant for the signed in user', async () => {
      await submitTask(input());

      expect(prismaMock.sweepstakesParticipant.upsert).toHaveBeenCalledWith({
        where: {
          userId_sweepstakesId: {
            userId: TEST_USER.id,
            sweepstakesId: 'sweep-1'
          }
        },
        update: {},
        create: { userId: TEST_USER.id, sweepstakesId: 'sweep-1' }
      });
    });

    it('loads the participant completions within the sweepstakes', async () => {
      await submitTask(input());

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-1',
          task: { sweepstakesId: 'sweep-1' }
        }
      });
    });
  });

  describe('when the task was already completed', () => {
    it('returns a silent VALIDATION_ERROR without recording a new completion', async () => {
      givenCompletions(completion('task-1'));

      const result = await submitTask(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'You have already completed this task. Refresh the page.'
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    let consoleError: MockInstance<typeof console.error>;

    beforeEach(() => {
      consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('does not log the already completed error', async () => {
      givenCompletions(completion('task-1'));

      await submitTask(input());

      expect(consoleError).not.toHaveBeenCalled();
    });

    it('logs the missing team error', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('BONUS_TASK'), { teamId: null })
      );

      await submitTask(input());

      expect(consoleError).toHaveBeenCalledWith(
        'Application error:',
        expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Giveaway team data is missing. Please contact support.'
        })
      );
    });
  });

  describe('prerequisite tasks', () => {
    it('requires the mandatory tasks to be completed first', async () => {
      givenTasks(
        storedTask('task-0', taskConfig('BONUS_TASK', { mandatory: true })),
        storedTask('task-1', taskConfig('BONUS_TASK'))
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'You must complete all mandatory tasks before submitting this task.'
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('allows a mandatory task to be submitted before other mandatory tasks', async () => {
      givenTasks(
        storedTask('task-0', taskConfig('BONUS_TASK', { mandatory: true })),
        storedTask('task-1', taskConfig('BONUS_TASK', { mandatory: true }))
      );

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
    });

    it('allows the task once every mandatory task is completed', async () => {
      givenTasks(
        storedTask('task-0', taskConfig('BONUS_TASK', { mandatory: true })),
        storedTask('task-1', taskConfig('BONUS_TASK'))
      );
      givenCompletions(completion('task-0'));

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
    });

    it('requires the configured number of completed tasks', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('BONUS_TASK', { tasksRequired: 3 }))
      );
      givenCompletions(completion('task-a'));

      const result = await submitTask(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'You must complete 2 more tasks before you can complete this one.'
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('uses the singular form when one more task is required', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('BONUS_TASK', { tasksRequired: 1 }))
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'You must complete 1 more task before you can complete this one.'
      );
    });
  });

  describe('validating the task', () => {
    it('rejects an incorrect secret code without recording a completion', async () => {
      givenTasks(storedTask('task-1', taskConfig('SECRET_CODE')));
      prismaMock.taskProgress.upsert.mockResolvedValue({ count: 1 });

      const result = await submitTask(input({ data: { code: 'MEOW' } }));

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'The secret code you entered is incorrect'
      );
      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId_taskId: {
              taskId: 'task-1',
              participantId: 'participant-1'
            }
          }
        })
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('validates a bluesky connection against the accounts of the signed in user', async () => {
      givenTasks(storedTask('task-1', taskConfig('BLUESKY_CONNECT')));
      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_USER.id,
        accounts: [{ provider: 'twitter' }]
      });

      const result = await submitTask(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'User does not have a Bluesky account connected'
      );
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        include: { accounts: true }
      });
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('records a completed bluesky connection when the user has a bluesky account', async () => {
      givenTasks(storedTask('task-1', taskConfig('BLUESKY_CONNECT')));
      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_USER.id,
        accounts: [{ provider: 'bluesky' }]
      });

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          proof: Prisma.JsonNull
        }
      });
    });

    it('records a completion with the submitted code as proof', async () => {
      givenTasks(storedTask('task-1', taskConfig('SECRET_CODE')));
      prismaMock.taskProgress.upsert.mockResolvedValue({ count: 1 });
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      const result = await submitTask(input({ data: { code: 'woof' } }));

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          proof: { code: 'woof' }
        }
      });
    });
  });

  describe('recording the completion', () => {
    it('records a completed bonus task with a JSON null proof and returns true', async () => {
      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          proof: Prisma.JsonNull
        }
      });
    });

    it('records the question and answer as proof for ask question tasks', async () => {
      givenTasks(storedTask('task-1', taskConfig('ASK_QUESTION')));
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      const result = await submitTask(input({ data: { answer: 'Loyalty' } }));

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          proof: { question: 'Why dogs?', answer: 'Loyalty' }
        }
      });
    });

    it('records import tasks as pending', async () => {
      givenTasks(storedTask('task-1', taskConfig('TWITTER_RETWEET_IMPORT_V2')));

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'PENDING',
          proof: Prisma.JsonNull
        }
      });
    });

    it('returns INTERNAL_SERVER_ERROR when the stored task config is invalid', async () => {
      givenTasks(storedTask('task-1', { type: 'BONUS_TASK', title: '' }));

      const result = await submitTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when saving the completion fails', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff/
      );
    });
  });

  describe('referrals', () => {
    it('ignores referrals when no referral cookie is present', async () => {
      const result = await submitTask(input());

      expectOk(result);
      expect(prismaMock.referral.findUnique).not.toHaveBeenCalled();
      expect(m.deleteCookie).not.toHaveBeenCalled();
    });

    it('credits the referrer when a first-time participant arrives with a referral code', async () => {
      m.referralCode = 'REF123';
      prismaMock.referral.findUnique.mockResolvedValue({
        id: 'referral-1',
        participantId: 'referrer-participant',
        taskId: 'ref-task',
        task: {
          id: 'ref-task',
          sweepstakesId: 'sweep-1',
          index: 1,
          config: toJsonConfig({
            ...taskConfig('REFERRAL_LINK'),
            id: 'ref-task'
          })
        },
        participant: { userId: 'referrer' },
        referredUsers: []
      });
      prismaMock.referredUser.findUnique.mockResolvedValue(null);

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
        where: { code: 'REF123' },
        include: { task: true, participant: true, referredUsers: true }
      });
      expect(prismaMock.referredUser.create).toHaveBeenCalledWith({
        data: { referralId: 'referral-1', userId: TEST_USER.id }
      });
      expect(prismaMock.taskCompletion.create).toHaveBeenLastCalledWith({
        data: {
          participantId: 'referrer-participant',
          taskId: 'ref-task',
          status: 'COMPLETED',
          proof: {
            referralId: 'referral-1',
            referredUserId: TEST_USER.id,
            sourceTaskId: 'task-1'
          }
        }
      });
      expect(m.deleteCookie).toHaveBeenCalledWith('referral_code');
    });

    it('returns a failure after the completion was recorded when the referral lookup fails', async () => {
      m.referralCode = 'REF123';
      prismaMock.referral.findUnique.mockRejectedValue(
        new Error('referral lookup failed')
      );

      const result = await submitTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'referral lookup failed'
      );
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
    });

    it('skips the referral when the participant had completions before this task', async () => {
      m.referralCode = 'REF123';
      givenCompletions(completion('task-0'));

      const result = await submitTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.referral.findUnique).not.toHaveBeenCalled();
      expect(m.deleteCookie).toHaveBeenCalledWith('referral_code');
    });
  });
});
