import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSingleChoice } from '../single-choice';
import { SingleChoiceTaskSchema, TASK_INPUT_SCHEMA } from '../../schemas';
import { prismaMock } from '@/test/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  taskCompletion
} from './fixtures-task-validation';

const task: SingleChoiceTaskSchema = {
  ...BASE_TASK,
  id: 'task-single',
  type: 'SINGLE_CHOICE',
  question: 'Pick a color',
  options: ['red', 'green', 'blue']
};

const input = (data: unknown) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId,
  data
});

describe('checkSingleChoice', () => {
  beforeEach(() => {
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the choice is one of the task options', () => {
    it('resolves when the participant has not completed the task', async () => {
      await expect(
        checkSingleChoice(db, input({ choice: 'green' }))
      ).resolves.toBeUndefined();
    });

    it('looks up an existing completion for the task and participant', async () => {
      await checkSingleChoice(db, input({ choice: 'green' }));

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { taskId: 'task-single', participantId: IDS.participantId }
      });
    });

    it('rejects with BAD_REQUEST when the task was already completed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-single')
      );

      const error = await applicationError(
        checkSingleChoice(db, input({ choice: 'green' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task already completed'
      });
    });
  });

  describe('when the choice is not one of the task options', () => {
    it('rejects with BAD_REQUEST "Invalid choice selected"', async () => {
      const error = await applicationError(
        checkSingleChoice(db, input({ choice: 'purple' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid choice selected'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('compares options case-sensitively', async () => {
      const error = await applicationError(
        checkSingleChoice(db, input({ choice: 'Green' }))
      );

      expect(error.message).toBe('Invalid choice selected');
    });
  });

  describe('when the input data is invalid', () => {
    it.each([
      ['missing data', undefined],
      ['an empty choice', { choice: '' }],
      ['a non-string choice', { choice: ['red'] }],
      ['a missing choice key', {}]
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(
          checkSingleChoice(db, input(data))
        );

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for single choice task'
        });
        expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the parsed choice is empty despite a successful parse', () => {
    it('rejects with BAD_REQUEST "Choice is required"', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.SINGLE_CHOICE, 'safeParse').mockReturnValue({
        success: true,
        data: { choice: '' }
      });

      const error = await applicationError(
        checkSingleChoice(db, input({ choice: '' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Choice is required'
      });
    });
  });
});
