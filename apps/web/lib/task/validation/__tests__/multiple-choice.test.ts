import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkMultipleChoice } from '../multiple-choice';
import { MultipleChoiceTaskSchema, TASK_INPUT_SCHEMA } from '../../schemas';
import { prismaMock } from '@/test/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  taskCompletion
} from './fixtures-task-validation';

const buildTask = (
  overrides: Partial<MultipleChoiceTaskSchema> = {}
): MultipleChoiceTaskSchema => ({
  ...BASE_TASK,
  id: 'task-multi',
  type: 'MULTIPLE_CHOICE',
  question: 'Pick colors',
  options: ['red', 'green', 'blue'],
  ...overrides
});

const input = (data: unknown, task = buildTask()) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId,
  data
});

describe('checkMultipleChoice', () => {
  beforeEach(() => {
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when every choice is a valid option', () => {
    it('resolves when the participant has not completed the task', async () => {
      await expect(
        checkMultipleChoice(db, input({ choices: ['red', 'blue'] }))
      ).resolves.toBeUndefined();
    });

    it('looks up an existing completion for the task and participant', async () => {
      await checkMultipleChoice(db, input({ choices: ['red'] }));

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { taskId: 'task-multi', participantId: IDS.participantId }
      });
    });

    it('rejects with BAD_REQUEST when the task was already completed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-multi')
      );

      const error = await applicationError(
        checkMultipleChoice(db, input({ choices: ['red'] }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task already completed'
      });
    });
  });

  describe('when a choice is not a task option', () => {
    it('rejects with BAD_REQUEST "Invalid choice selected"', async () => {
      const error = await applicationError(
        checkMultipleChoice(db, input({ choices: ['red', 'purple'] }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid choice selected'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('minimum selections', () => {
    it('rejects when fewer choices than minSelections are submitted', async () => {
      const error = await applicationError(
        checkMultipleChoice(
          db,
          input({ choices: ['red'] }, buildTask({ minSelections: 2 }))
        )
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'At least 2 option(s) must be selected'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('accepts exactly minSelections choices', async () => {
      await expect(
        checkMultipleChoice(
          db,
          input({ choices: ['red', 'green'] }, buildTask({ minSelections: 2 }))
        )
      ).resolves.toBeUndefined();
    });

    it('counts duplicate choices toward minSelections', async () => {
      await expect(
        checkMultipleChoice(
          db,
          input({ choices: ['red', 'red'] }, buildTask({ minSelections: 2 }))
        )
      ).resolves.toBeUndefined();
    });
  });

  describe('maximum selections', () => {
    it('rejects when more choices than maxSelections are submitted', async () => {
      const error = await applicationError(
        checkMultipleChoice(
          db,
          input(
            { choices: ['red', 'green', 'blue'] },
            buildTask({ maxSelections: 2 })
          )
        )
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'At most 2 option(s) can be selected'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('accepts exactly maxSelections choices', async () => {
      await expect(
        checkMultipleChoice(
          db,
          input({ choices: ['red', 'green'] }, buildTask({ maxSelections: 2 }))
        )
      ).resolves.toBeUndefined();
    });

    it('checks the minimum before the maximum', async () => {
      const error = await applicationError(
        checkMultipleChoice(
          db,
          input(
            { choices: ['red', 'green'] },
            buildTask({ minSelections: 3, maxSelections: 1 })
          )
        )
      );

      expect(error.message).toBe('At least 3 option(s) must be selected');
    });
  });

  describe('when the input data is invalid', () => {
    it.each([
      ['missing data', undefined],
      ['an empty choices array', { choices: [] }],
      ['a non-array choices value', { choices: 'red' }],
      ['non-string choices', { choices: [1, 2] }],
      ['a missing choices key', {}]
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(
          checkMultipleChoice(db, input(data))
        );

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for multiple choice task'
        });
        expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the parsed choices bypass the schema rules', () => {
    it('rejects with "Choices are required" when choices is not an array', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.MULTIPLE_CHOICE, 'safeParse').mockReturnValue({
        success: true,
        data: { choices: 'red' as unknown as string[] }
      });

      const error = await applicationError(
        checkMultipleChoice(db, input({ choices: 'red' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Choices are required'
      });
    });

    it('rejects with "At least one choice must be selected" when choices is empty', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.MULTIPLE_CHOICE, 'safeParse').mockReturnValue({
        success: true,
        data: { choices: [] }
      });

      const error = await applicationError(
        checkMultipleChoice(db, input({ choices: [] }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'At least one choice must be selected'
      });
    });
  });
});
