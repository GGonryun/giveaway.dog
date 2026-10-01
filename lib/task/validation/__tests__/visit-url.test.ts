import { describe, it, expect } from 'vitest';
import { checkVisitUrl } from '../visit-url';
import { VisitUrlTaskSchema } from '../../schemas';
import { BASE_TASK, IDS, applicationError } from './fixtures-task-validation';

const buildTask = (
  afterVisit?: VisitUrlTaskSchema['afterVisit']
): VisitUrlTaskSchema => ({
  ...BASE_TASK,
  id: 'task-visit',
  type: 'VISIT_URL',
  href: 'https://example.com',
  label: 'Visit example',
  afterVisit
});

const questionTask = buildTask({
  type: 'QUESTION',
  question: 'What did you see?',
  input: 'TEXT'
});

const input = (task: VisitUrlTaskSchema, data: unknown) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId,
  data
});

describe('checkVisitUrl', () => {
  describe('when the task has no follow-up question', () => {
    it.each([
      ['no afterVisit', undefined],
      ['a DELAY afterVisit', { type: 'DELAY' as const, seconds: 5 }],
      ['an INSTANT afterVisit', { type: 'INSTANT' as const }]
    ])(
      'resolves without validating the data for %s',
      async (_label, afterVisit) => {
        await expect(
          checkVisitUrl(input(buildTask(afterVisit), 'not-an-object'))
        ).resolves.toBeUndefined();
      }
    );
  });

  describe('when the task asks a follow-up question', () => {
    it('resolves when a non-blank answer is provided', async () => {
      await expect(
        checkVisitUrl(input(questionTask, { answer: 'A dog' }))
      ).resolves.toBeUndefined();
    });

    it('resolves when the answer is omitted', async () => {
      await expect(
        checkVisitUrl(input(questionTask, {}))
      ).resolves.toBeUndefined();
    });

    it('resolves when the answer is an empty string', async () => {
      await expect(
        checkVisitUrl(input(questionTask, { answer: '' }))
      ).resolves.toBeUndefined();
    });

    it('rejects with BAD_REQUEST when the answer is only whitespace', async () => {
      const error = await applicationError(
        checkVisitUrl(input(questionTask, { answer: '   ' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Answer are required for this task'
      });
    });

    it.each([
      ['missing data', undefined],
      ['a non-string answer', { answer: 7 }],
      ['a non-object payload', 'answer']
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(
          checkVisitUrl(input(questionTask, data))
        );

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for visit URL task'
        });
      }
    );
  });
});
