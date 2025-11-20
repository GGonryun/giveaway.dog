import { PrismaClient } from '@prisma/client';
import { SecretCodeTaskSchema, TASK_INPUT_SCHEMA } from '../schemas';
import { ApplicationError } from '@/lib/errors';
import { ValidateTaskInput } from './integrations';

const MAX_ATTEMPTS = 10;

export const checkSecretCode = async (
  db: PrismaClient,
  input: ValidateTaskInput<SecretCodeTaskSchema>
): Promise<void> => {
  const existingProgress = await db.taskProgress.upsert({
    where: {
      userId_taskId: {
        taskId: input.task.id,
        userId: input.userId
      }
    },
    update: {
      count: {
        increment: 1
      }
    },
    create: {
      taskId: input.task.id,
      userId: input.userId,
      count: 1
    }
  });

  if (existingProgress.count >= MAX_ATTEMPTS) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Maximum number of attempts reached for this task'
    });
  }

  const parsed = TASK_INPUT_SCHEMA.SECRET_CODE.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for secret code task'
    });
  }

  const submittedCode = parsed.data.code;
  if (!submittedCode || typeof submittedCode !== 'string') {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Secret code is required'
    });
  }

  if (submittedCode !== input.task.code) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'The secret code you entered is incorrect'
    });
  }

  // Check if the user has already completed this task
  const existingCompletion = await db.taskCompletion.findFirst({
    where: {
      taskId: input.task.id,
      userId: input.userId
    }
  });

  if (existingCompletion) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Task already completed'
    });
  }
};
