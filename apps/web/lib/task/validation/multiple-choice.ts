import { PrismaClient } from '@prisma/client';
import { MultipleChoiceTaskSchema, TASK_INPUT_SCHEMA } from '../schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { ValidateTaskInput } from './types';

export const checkMultipleChoice = async (
  db: PrismaClient,
  input: ValidateTaskInput<MultipleChoiceTaskSchema>
): Promise<void> => {
  const parsed = TASK_INPUT_SCHEMA.MULTIPLE_CHOICE.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for multiple choice task'
    });
  }

  const submittedChoices = parsed.data.choices;
  if (!submittedChoices || !Array.isArray(submittedChoices)) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Choices are required'
    });
  }

  if (submittedChoices.length === 0) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'At least one choice must be selected'
    });
  }

  for (const choice of submittedChoices) {
    if (!input.task.options.includes(choice)) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Invalid choice selected'
      });
    }
  }

  if (
    input.task.minSelections &&
    submittedChoices.length < input.task.minSelections
  ) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: `At least ${input.task.minSelections} option(s) must be selected`
    });
  }

  if (
    input.task.maxSelections &&
    submittedChoices.length > input.task.maxSelections
  ) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: `At most ${input.task.maxSelections} option(s) can be selected`
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
