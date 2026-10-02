import { ApplicationError } from '@/lib/errors';
import { VisitUrlTaskSchema, TASK_INPUT_SCHEMA } from '../schemas';
import { ValidateTaskInput } from './types';

export const checkVisitUrl = async (
  input: ValidateTaskInput<VisitUrlTaskSchema>
): Promise<void> => {
  if (input.task.afterVisit?.type !== 'QUESTION') {
    return;
  }

  const parsed = TASK_INPUT_SCHEMA.VISIT_URL.safeParse(input.data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data for visit URL task'
    });
  }

  const { answer } = parsed.data;

  if (answer) {
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Answer are required for this task'
      });
    }
  }
};
