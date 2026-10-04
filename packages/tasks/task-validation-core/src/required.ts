import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { Prisma } from '@giveaway/db-model';
import { toTaskSchema } from '@giveaway/task-model/schemas';

export const validateRequiredTasks = async ({
  taskId,
  tasks,
  completions
}: {
  taskId: string;
  tasks: Prisma.TaskGetPayload<{}>[];
  completions: Prisma.TaskCompletionGetPayload<{}>[];
}) => {
  const parsed = tasks.map(toTaskSchema);

  const currentTask = parsed.find((t) => t.id === taskId);

  if (!currentTask) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Task not found.'
    });
  }

  if (currentTask.tasksRequired === 0) {
    return;
  }

  const completedTasksCount = completions.length;

  if (completedTasksCount < currentTask.tasksRequired) {
    const remaining = currentTask.tasksRequired - completedTasksCount;
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: `You must complete ${remaining} more ${remaining === 1 ? 'task' : 'tasks'} before you can complete this one.`
    });
  }
};
