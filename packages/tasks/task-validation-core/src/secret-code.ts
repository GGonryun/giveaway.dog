import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  SecretCodeTaskSchema,
  SecretCodeV2TaskSchema,
  TASK_INPUT_SCHEMA
} from '@giveaway/task-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { ValidateTaskInput } from '@giveaway/task-model/types';

const MAX_ATTEMPTS = 25;

const recordAttempt = async (
  db: PrismaClient,
  input: ValidateTaskInput<SecretCodeTaskSchema | SecretCodeV2TaskSchema>
): Promise<void> => {
  if (input.reverify) {
    return;
  }

  const existingProgress = await db.taskProgress.upsert({
    where: {
      participantId_taskId: {
        taskId: input.task.id,
        participantId: input.participantId
      }
    },
    update: {
      count: {
        increment: 1
      }
    },
    create: {
      taskId: input.task.id,
      participantId: input.participantId,
      count: 1
    }
  });

  if (existingProgress.count >= MAX_ATTEMPTS) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Maximum number of attempts reached for this task'
    });
  }
};

const assertNotCompleted = async (
  db: PrismaClient,
  input: ValidateTaskInput<SecretCodeTaskSchema | SecretCodeV2TaskSchema>
): Promise<void> => {
  if (input.reverify) {
    return;
  }

  const existingCompletion = await db.taskCompletion.findFirst({
    where: {
      taskId: input.task.id,
      participantId: input.participantId
    }
  });

  if (existingCompletion) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Task already completed'
    });
  }
};

export const checkSecretCode = async (
  db: PrismaClient,
  input: ValidateTaskInput<SecretCodeTaskSchema>
): Promise<void> => {
  await recordAttempt(db, input);

  const parsed = TASK_INPUT_SCHEMA.SECRET_CODE.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for secret code task'
    });
  }

  const submittedCode = parsed.data.code;
  // Stryker disable next-line ConditionalExpression: the input schema already refuses an empty or missing code
  if (!submittedCode || typeof submittedCode !== 'string') {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Secret code is required'
    });
  }

  if (input.task.caseSensitive) {
    if (submittedCode !== input.task.code) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        silent: true,
        message: 'The secret code you entered is incorrect'
      });
    }
  } else {
    if (submittedCode.toLowerCase() !== input.task.code.toLowerCase()) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        silent: true,
        message: 'The secret code you entered is incorrect'
      });
    }
  }

  await assertNotCompleted(db, input);
};

export const checkSecretCodeV2 = async (
  db: PrismaClient,
  input: ValidateTaskInput<SecretCodeV2TaskSchema>
): Promise<void> => {
  await recordAttempt(db, input);

  const parsed = TASK_INPUT_SCHEMA.SECRET_CODE_V2.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for secret code task'
    });
  }

  const submittedCode = parsed.data.code;
  // Stryker disable next-line ConditionalExpression: the input schema already refuses an empty or missing code
  if (!submittedCode || typeof submittedCode !== 'string') {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Secret code is required'
    });
  }

  const isMatch = input.task.codes.some((code) => {
    if (input.task.caseSensitive) {
      return submittedCode === code;
    }
    return submittedCode.toLowerCase() === code.toLowerCase();
  });

  if (!isMatch) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      silent: true,
      message: 'The secret code you entered is incorrect'
    });
  }

  await assertNotCompleted(db, input);
};
