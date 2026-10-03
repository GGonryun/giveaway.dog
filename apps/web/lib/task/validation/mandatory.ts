import { ApplicationError } from '@giveaway/util-errors';
import { Prisma } from '@prisma/client';
import { toTaskSchema } from '../schemas';

export const validateMandatoryTasks = async ({
  taskId,
  tasks,
  completions
}: {
  taskId: string;
  tasks: Prisma.TaskGetPayload<{}>[];
  completions: Prisma.TaskCompletionGetPayload<{}>[];
}) => {
  const parsed = tasks.map(toTaskSchema);
  const mandatoryTasks = parsed.filter((t) => t.mandatory);

  // check if the current task is mandatory or not
  const currentTask = parsed.find((t) => t.id === taskId);
  // if the current task is mandatory, we don't need to check further and it's allowed to submit
  if (currentTask && currentTask.mandatory) {
    return;
  }
  // otherwise, ensure all mandatory tasks have been completed before allowing submission
  for (const task of mandatoryTasks) {
    const completed = completions.find((c) => c.taskId === task.id);
    if (!completed) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `You must complete all mandatory tasks before submitting this task.`
      });
    }
  }
};
