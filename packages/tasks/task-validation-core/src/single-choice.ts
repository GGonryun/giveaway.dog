import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  SingleChoiceTaskSchema,
  TASK_INPUT_SCHEMA
} from '@giveaway/task-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { ValidateTaskInput } from '@giveaway/task-model/types';

export const checkSingleChoice = async (
  db: PrismaClient,
  input: ValidateTaskInput<SingleChoiceTaskSchema>
): Promise<void> => {
  const parsed = TASK_INPUT_SCHEMA.SINGLE_CHOICE.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for single choice task'
    });
  }

  const submittedChoice = parsed.data.choice;
  if (!submittedChoice || typeof submittedChoice !== 'string') {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Choice is required'
    });
  }

  if (!input.task.options.includes(submittedChoice)) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid choice selected'
    });
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
