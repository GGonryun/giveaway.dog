import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAskQuestion } from '../ask-question';
import {
  AskQuestionTaskSchema,
  TASK_INPUT_SCHEMA
} from '@giveaway/task-model/schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  taskCompletion
} from '@giveaway/testing-server/fixtures-task-validation';

const task: AskQuestionTaskSchema = {
  ...BASE_TASK,
  id: 'task-question',
  type: 'ASK_QUESTION',
  question: 'What is your favorite dog?'
};

const input = (data: unknown) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId,
  data
});

describe('checkAskQuestion', () => {
  beforeEach(() => {
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the answer is valid', () => {
    it('resolves when the participant has not completed the task', async () => {
      await expect(
        checkAskQuestion(db, input({ answer: 'Corgi' }))
      ).resolves.toBeUndefined();
    });

    it('looks up an existing completion for the task and participant', async () => {
      await checkAskQuestion(db, input({ answer: 'Corgi' }));

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { taskId: 'task-question', participantId: IDS.participantId }
      });
    });

    it('rejects with BAD_REQUEST when the task was already completed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-question')
      );

      const error = await applicationError(
        checkAskQuestion(db, input({ answer: 'Corgi' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task already completed',
        silent: false
      });
    });
  });

  describe('when the input data is invalid', () => {
    it.each([
      ['missing data', undefined],
      ['an empty answer', { answer: '' }],
      ['a non-string answer', { answer: 42 }],
      ['a missing answer key', {}]
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(checkAskQuestion(db, input(data)));

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for ask question task'
        });
        expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the parsed answer is empty despite a successful parse', () => {
    it('rejects with BAD_REQUEST "Answer is required"', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.ASK_QUESTION, 'safeParse').mockReturnValue({
        success: true,
        data: { answer: '' }
      });

      const error = await applicationError(
        checkAskQuestion(db, input({ answer: '' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Answer is required'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });
  });
});
