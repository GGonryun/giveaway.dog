import { describe, it, expect } from 'vitest';
import { validateRequiredTasks } from '../required';
import {
  BASE_TASK,
  applicationError,
  storedTask,
  taskCompletion
} from './fixtures-task-validation';

const bonusTask = (id: string, tasksRequired: number) =>
  storedTask(id, { ...BASE_TASK, type: 'BONUS_TASK', tasksRequired });

const TASKS = [
  bonusTask('task-a', 0),
  bonusTask('task-b', 0),
  bonusTask('task-c', 0),
  bonusTask('task-gated', 2)
];

describe('validateRequiredTasks', () => {
  it('rejects with NOT_FOUND when the submitted task is not in the list', async () => {
    const error = await applicationError(
      validateRequiredTasks({
        taskId: 'task-missing',
        tasks: TASKS,
        completions: []
      })
    );

    expect(error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Task not found.'
    });
  });

  it('resolves when the task requires no prior completions', async () => {
    await expect(
      validateRequiredTasks({ taskId: 'task-a', tasks: TASKS, completions: [] })
    ).resolves.toBeUndefined();
  });

  it('rejects with the plural message when several tasks remain', async () => {
    const error = await applicationError(
      validateRequiredTasks({
        taskId: 'task-gated',
        tasks: TASKS,
        completions: []
      })
    );

    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message:
        'You must complete 2 more tasks before you can complete this one.'
    });
  });

  it('rejects with the singular message when one task remains', async () => {
    const error = await applicationError(
      validateRequiredTasks({
        taskId: 'task-gated',
        tasks: TASKS,
        completions: [taskCompletion('task-a')]
      })
    );

    expect(error.message).toBe(
      'You must complete 1 more task before you can complete this one.'
    );
  });

  it('resolves when exactly the required number of tasks is completed', async () => {
    await expect(
      validateRequiredTasks({
        taskId: 'task-gated',
        tasks: TASKS,
        completions: [taskCompletion('task-a'), taskCompletion('task-b')]
      })
    ).resolves.toBeUndefined();
  });

  it('resolves when more than the required number of tasks is completed', async () => {
    await expect(
      validateRequiredTasks({
        taskId: 'task-gated',
        tasks: TASKS,
        completions: [
          taskCompletion('task-a'),
          taskCompletion('task-b'),
          taskCompletion('task-c')
        ]
      })
    ).resolves.toBeUndefined();
  });

  it('counts completions regardless of their status or task', async () => {
    await expect(
      validateRequiredTasks({
        taskId: 'task-gated',
        tasks: TASKS,
        completions: [
          taskCompletion('task-a', { status: 'REJECTED' }),
          taskCompletion('task-unrelated', { status: 'PENDING' })
        ]
      })
    ).resolves.toBeUndefined();
  });

  it('rejects with the task schema parse error for an invalid config', async () => {
    const error = await applicationError(
      validateRequiredTasks({
        taskId: 'task-a',
        tasks: [storedTask('task-a', null)],
        completions: []
      })
    );

    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config'
    });
  });
});
