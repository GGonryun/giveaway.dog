import { describe, it, expect } from 'vitest';
import { validateMandatoryTasks } from '../mandatory';
import {
  BASE_TASK,
  applicationError,
  storedTask,
  taskCompletion
} from '@giveaway/testing-server/fixtures-task-validation';

const bonusTask = (id: string, mandatory: boolean) =>
  storedTask(id, { ...BASE_TASK, type: 'BONUS_TASK', mandatory });

const MANDATORY_MESSAGE =
  'You must complete all mandatory tasks before submitting this task.';

describe('validateMandatoryTasks', () => {
  describe('when there are no mandatory tasks', () => {
    it('resolves without any completions', async () => {
      await expect(
        validateMandatoryTasks({
          taskId: 'task-a',
          tasks: [bonusTask('task-a', false), bonusTask('task-b', false)],
          completions: []
        })
      ).resolves.toBeUndefined();
    });

    it('resolves when there are no tasks at all', async () => {
      await expect(
        validateMandatoryTasks({ taskId: 'task-a', tasks: [], completions: [] })
      ).resolves.toBeUndefined();
    });
  });

  describe('when the submitted task is mandatory', () => {
    it('resolves even if other mandatory tasks are incomplete', async () => {
      await expect(
        validateMandatoryTasks({
          taskId: 'task-a',
          tasks: [bonusTask('task-a', true), bonusTask('task-b', true)],
          completions: []
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('when the submitted task is optional', () => {
    it('resolves when every mandatory task is completed', async () => {
      await expect(
        validateMandatoryTasks({
          taskId: 'task-c',
          tasks: [
            bonusTask('task-a', true),
            bonusTask('task-b', true),
            bonusTask('task-c', false)
          ],
          completions: [taskCompletion('task-a'), taskCompletion('task-b')]
        })
      ).resolves.toBeUndefined();
    });

    it('rejects with VALIDATION_ERROR when a mandatory task is incomplete', async () => {
      const error = await applicationError(
        validateMandatoryTasks({
          taskId: 'task-c',
          tasks: [
            bonusTask('task-a', true),
            bonusTask('task-b', true),
            bonusTask('task-c', false)
          ],
          completions: [taskCompletion('task-a')]
        })
      );

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: MANDATORY_MESSAGE
      });
    });

    it('ignores completions of optional tasks', async () => {
      const error = await applicationError(
        validateMandatoryTasks({
          taskId: 'task-c',
          tasks: [bonusTask('task-a', true), bonusTask('task-c', false)],
          completions: [taskCompletion('task-c')]
        })
      );

      expect(error.message).toBe(MANDATORY_MESSAGE);
    });

    it('accepts a mandatory completion regardless of its status', async () => {
      await expect(
        validateMandatoryTasks({
          taskId: 'task-c',
          tasks: [bonusTask('task-a', true), bonusTask('task-c', false)],
          completions: [taskCompletion('task-a', { status: 'REJECTED' })]
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('when the submitted task is not in the list', () => {
    it('still requires every mandatory task', async () => {
      const error = await applicationError(
        validateMandatoryTasks({
          taskId: 'task-missing',
          tasks: [bonusTask('task-a', true)],
          completions: []
        })
      );

      expect(error.message).toBe(MANDATORY_MESSAGE);
    });
  });

  describe('when a stored task config is invalid', () => {
    it('rejects with the task schema parse error', async () => {
      const error = await applicationError(
        validateMandatoryTasks({
          taskId: 'task-a',
          tasks: [storedTask('task-a', { type: 'NOT_A_TASK' })],
          completions: []
        })
      );

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });
  });
});
