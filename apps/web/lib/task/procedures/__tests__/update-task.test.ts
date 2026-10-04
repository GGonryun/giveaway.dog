import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { Prisma } from '@prisma/client';
import type { Sweepstakes, SweepstakesTiming } from '@prisma/client';
import updateTask from '../update-task';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, signOut, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  buildSweepstakes,
  buildTiming,
  taskConfig,
  toJsonConfig
} from '@giveaway/task-model/testing/fixtures-task-procedures-verification';

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

const input = (overrides: Partial<Parameters<typeof updateTask>[0]> = {}) => ({
  taskId: 'task-1',
  sweepstakesId: 'sweep-1',
  ...overrides
});

const givenTasks = (...tasks: ReturnType<typeof storedTask>[]) =>
  prismaMock.task.findMany.mockResolvedValue(tasks);

const givenCompletions = (...completions: ReturnType<typeof completion>[]) =>
  prismaMock.taskCompletion.findMany.mockResolvedValue(completions);

describe('updateTask', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    signIn();
    givenTasks(storedTask('task-1', taskConfig('ASK_QUESTION')));
    prismaMock.sweepstakesParticipant.upsert.mockResolvedValue(participant);
    givenCompletions(completion('task-1'));
    prismaMock.taskCompletion.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      signOut();

      const result = await updateTask(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it('rejects input without a task id', async () => {
      const result = await updateTask({
        sweepstakesId: 'sweep-1'
      } as unknown as Parameters<typeof updateTask>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('loading the task', () => {
    it('loads every task of the sweepstakes with timing and visibility', async () => {
      await updateTask(input({ data: { answer: 'Yes' } }));

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-1' },
        include: {
          sweepstakes: { include: { timing: true, visibility: true } }
        }
      });
    });

    it('returns NOT_FOUND when the task is not part of the sweepstakes', async () => {
      const result = await updateTask(input({ taskId: 'task-404' }));

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
      );
      expect(prismaMock.sweepstakesParticipant.upsert).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the giveaway has not started', async () => {
      givenTasks(
        storedTask(
          'task-1',
          taskConfig('ASK_QUESTION'),
          {},
          buildTiming({ startDate: new Date(NOW.getTime() + 1) })
        )
      );

      const result = await updateTask(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This giveaway has not started yet.'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the giveaway has no team', async () => {
      givenTasks(
        storedTask('task-1', taskConfig('ASK_QUESTION'), { teamId: null })
      );

      const result = await updateTask(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Giveaway team data is missing. Please contact support.'
      );
      expect(prismaMock.sweepstakesParticipant.upsert).not.toHaveBeenCalled();
    });
  });

  describe('finding the completion to update', () => {
    it('upserts the participant for the signed in user', async () => {
      await updateTask(input({ data: { answer: 'Yes' } }));

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

    it('loads every completion of the participant within the sweepstakes', async () => {
      await updateTask(input({ data: { answer: 'Yes' } }));

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-1',
          task: { sweepstakesId: 'sweep-1' }
        }
      });
    });

    it('returns a silent CONFLICT when the participant has no completions', async () => {
      givenCompletions();

      const result = await updateTask(input());

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'You have not completed this task yet.'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the participant has more than one completion', async () => {
      givenCompletions(completion('task-1'), completion('task-2'));

      const result = await updateTask(input({ data: { answer: 'Yes' } }));

      const failure = expectFailure(result, 'INTERNAL_SERVER_ERROR');
      expect(failure.message).toBe(
        'Multiple completions found for this task. Please contact support.'
      );
      expect(failure.cause).toBe(
        'Users cannot modify multiple completions of the same task with this procedure.'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns a silent CONFLICT when the only completion belongs to another task', async () => {
      givenCompletions(completion('task-2'));

      const result = await updateTask(input({ data: { answer: 'Yes' } }));

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'You have not completed this task yet.'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
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

    it('does not log the conflict when the participant has no completions', async () => {
      givenCompletions();

      await updateTask(input());

      expect(consoleError).not.toHaveBeenCalled();
    });

    it('does not log the conflict when the only completion belongs to another task', async () => {
      givenCompletions(completion('task-2'));

      await updateTask(input({ data: { answer: 'Yes' } }));

      expect(consoleError).not.toHaveBeenCalled();
    });

    it('logs the multiple completions error', async () => {
      givenCompletions(completion('task-1'), completion('task-2'));

      await updateTask(input({ data: { answer: 'Yes' } }));

      expect(consoleError).toHaveBeenCalledWith(
        'Application error:',
        expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Multiple completions found for this task. Please contact support.'
        })
      );
    });
  });

  describe('updating the proof', () => {
    it('replaces the proof of the existing completion and returns true', async () => {
      const result = await updateTask(input({ data: { answer: 'Updated' } }));

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-task-1' },
        data: { proof: { question: 'Why dogs?', answer: 'Updated' } }
      });
    });

    it('stores a JSON null proof for tasks without proof', async () => {
      givenTasks(storedTask('task-1', taskConfig('BONUS_TASK')));

      const result = await updateTask(input());

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-task-1' },
        data: { proof: Prisma.JsonNull }
      });
    });

    it('does not create completions or change the completion status', async () => {
      await updateTask(input({ data: { answer: 'Updated' } }));

      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ status: expect.anything() })
        })
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the submitted proof is invalid', async () => {
      const result = await updateTask(input({ data: { answer: '' } }));

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toContain(
        'Answer is required'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the stored task config is invalid', async () => {
      givenTasks(storedTask('task-1', { type: 'ASK_QUESTION', value: 1 }));

      const result = await updateTask(input({ data: { answer: 'Yes' } }));

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the completion disappears before the update', async () => {
      prismaMock.taskCompletion.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await updateTask(input({ data: { answer: 'Yes' } }));

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
