import { Prisma, Task } from '@prisma/client';
import { taskSchema, TaskSchema } from './schemas';
import { ApplicationError } from '@/lib/errors';
import { toJsonObject } from '@/lib/json';

export const toTaskSchema = (stored: Task): TaskSchema => {
  const json = toJsonObject(stored.config);
  const parsed = taskSchema.safeParse({
    ...json,
    id: stored.id
  });
  if (parsed.success) {
    return parsed.data;
  } else {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config',
      cause: parsed.error
    });
  }
};
