import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import {
  AskQuestionTaskSchema,
  TASK_INPUT_SCHEMA
} from '@giveaway/task-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { ValidateTaskInput } from '@giveaway/task-model/types';

export const checkAskQuestion = async (
  db: PrismaClient,
  input: ValidateTaskInput<AskQuestionTaskSchema>
): Promise<void> => {
  const parsed = TASK_INPUT_SCHEMA.ASK_QUESTION.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for ask question task'
    });
  }

  const submittedAnswer = parsed.data.answer;
  if (!submittedAnswer || typeof submittedAnswer !== 'string') {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Answer is required'
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
