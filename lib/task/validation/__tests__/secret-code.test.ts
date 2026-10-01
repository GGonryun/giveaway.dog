import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSecretCode, checkSecretCodeV2 } from '../secret-code';
import {
  SecretCodeTaskSchema,
  SecretCodeV2TaskSchema,
  TASK_INPUT_SCHEMA
} from '../../schemas';
import { prismaMock } from '@/test/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  taskCompletion
} from './fixtures-task-validation';

const buildTask = (
  overrides: Partial<SecretCodeTaskSchema> = {}
): SecretCodeTaskSchema => ({
  ...BASE_TASK,
  id: 'task-secret',
  type: 'SECRET_CODE',
  code: 'WoofWoof',
  caseSensitive: false,
  ...overrides
});

const buildTaskV2 = (
  overrides: Partial<SecretCodeV2TaskSchema> = {}
): SecretCodeV2TaskSchema => ({
  ...BASE_TASK,
  id: 'task-secret-v2',
  type: 'SECRET_CODE_V2',
  codes: ['Alpha', 'Bravo'],
  caseSensitive: false,
  ...overrides
});

const input = <T>(task: T, data: unknown) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId,
  data
});

const progress = (count: number) => ({
  id: 'progress-1',
  participantId: IDS.participantId,
  taskId: 'task-secret',
  count,
  updatedAt: new Date('2024-01-01T00:00:00.000Z')
});

describe('checkSecretCode', () => {
  beforeEach(() => {
    prismaMock.taskProgress.upsert.mockResolvedValue(progress(1));
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attempt tracking', () => {
    it('increments the attempt counter for the participant and task', async () => {
      await checkSecretCode(db, input(buildTask(), { code: 'WoofWoof' }));

      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledWith({
        where: {
          participantId_taskId: {
            taskId: 'task-secret',
            participantId: IDS.participantId
          }
        },
        update: { count: { increment: 1 } },
        create: {
          taskId: 'task-secret',
          participantId: IDS.participantId,
          count: 1
        }
      });
    });

    it('rejects with FORBIDDEN once the attempt count reaches 25', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue(progress(25));

      const error = await applicationError(
        checkSecretCode(db, input(buildTask(), { code: 'WoofWoof' }))
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Maximum number of attempts reached for this task'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('still accepts the 24th attempt', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue(progress(24));

      await expect(
        checkSecretCode(db, input(buildTask(), { code: 'WoofWoof' }))
      ).resolves.toBeUndefined();
    });

    it('counts the attempt even when the input data is invalid', async () => {
      await applicationError(checkSecretCode(db, input(buildTask(), {})));

      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('input validation', () => {
    it.each([
      ['missing data', undefined],
      ['an empty code', { code: '' }],
      ['a non-string code', { code: 1234 }]
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(
          checkSecretCode(db, input(buildTask(), data))
        );

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for secret code task'
        });
      }
    );

    it('rejects with BAD_REQUEST when the parsed code is empty', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.SECRET_CODE, 'safeParse').mockReturnValue({
        success: true,
        data: { code: '' }
      });

      const error = await applicationError(
        checkSecretCode(db, input(buildTask(), { code: '' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Secret code is required'
      });
    });
  });

  describe('when the task is case-insensitive', () => {
    it('accepts a code that differs only by case', async () => {
      await expect(
        checkSecretCode(db, input(buildTask(), { code: 'WOOFWOOF' }))
      ).resolves.toBeUndefined();
    });

    it('treats a null caseSensitive flag as case-insensitive', async () => {
      await expect(
        checkSecretCode(
          db,
          input(buildTask({ caseSensitive: null }), { code: 'woofwoof' })
        )
      ).resolves.toBeUndefined();
    });

    it('rejects a different code with a silent BAD_REQUEST', async () => {
      const error = await applicationError(
        checkSecretCode(db, input(buildTask(), { code: 'Meow' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'The secret code you entered is incorrect',
        silent: true
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('does not trim surrounding whitespace', async () => {
      const error = await applicationError(
        checkSecretCode(db, input(buildTask(), { code: ' WoofWoof ' }))
      );

      expect(error.message).toBe('The secret code you entered is incorrect');
    });
  });

  describe('when the task is case-sensitive', () => {
    it('accepts the exact code', async () => {
      await expect(
        checkSecretCode(
          db,
          input(buildTask({ caseSensitive: true }), { code: 'WoofWoof' })
        )
      ).resolves.toBeUndefined();
    });

    it('rejects a code that differs only by case with a silent BAD_REQUEST', async () => {
      const error = await applicationError(
        checkSecretCode(
          db,
          input(buildTask({ caseSensitive: true }), { code: 'woofwoof' })
        )
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'The secret code you entered is incorrect',
        silent: true
      });
    });
  });

  describe('completion check', () => {
    it('looks up an existing completion for the task and participant', async () => {
      await checkSecretCode(db, input(buildTask(), { code: 'WoofWoof' }));

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { taskId: 'task-secret', participantId: IDS.participantId }
      });
    });

    it('rejects with BAD_REQUEST when the task was already completed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-secret')
      );

      const error = await applicationError(
        checkSecretCode(db, input(buildTask(), { code: 'WoofWoof' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task already completed',
        silent: false
      });
    });
  });
});

describe('checkSecretCodeV2', () => {
  beforeEach(() => {
    prismaMock.taskProgress.upsert.mockResolvedValue(progress(1));
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attempt tracking', () => {
    it('increments the attempt counter for the participant and task', async () => {
      await checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }));

      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledWith({
        where: {
          participantId_taskId: {
            taskId: 'task-secret-v2',
            participantId: IDS.participantId
          }
        },
        update: { count: { increment: 1 } },
        create: {
          taskId: 'task-secret-v2',
          participantId: IDS.participantId,
          count: 1
        }
      });
    });

    it('rejects with FORBIDDEN once the attempt count reaches 25', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue(progress(25));

      const error = await applicationError(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }))
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Maximum number of attempts reached for this task'
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('keeps rejecting with FORBIDDEN above 25 attempts', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue(progress(30));

      const error = await applicationError(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }))
      );

      expect(error.code).toBe('FORBIDDEN');
    });

    it('still accepts the 24th attempt', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue(progress(24));

      await expect(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }))
      ).resolves.toBeUndefined();
    });

    it('counts the attempt even when the input data is invalid', async () => {
      await applicationError(checkSecretCodeV2(db, input(buildTaskV2(), {})));

      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('input validation', () => {
    it.each([
      ['missing data', undefined],
      ['an empty code', { code: '' }],
      ['a non-string code', { code: false }]
    ])(
      'rejects with VALIDATION_ERROR for %s',
      async (_label, data: unknown) => {
        const error = await applicationError(
          checkSecretCodeV2(db, input(buildTaskV2(), data))
        );

        expect(error).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data for secret code task'
        });
      }
    );

    it('rejects with BAD_REQUEST when the parsed code is empty', async () => {
      vi.spyOn(TASK_INPUT_SCHEMA.SECRET_CODE_V2, 'safeParse').mockReturnValue({
        success: true,
        data: { code: '' }
      });

      const error = await applicationError(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: '' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Secret code is required'
      });
    });
  });

  describe('code matching', () => {
    it('accepts any of the configured codes', async () => {
      await expect(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Bravo' }))
      ).resolves.toBeUndefined();
    });

    it('matches case-insensitively when caseSensitive is false', async () => {
      await expect(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'bRAVO' }))
      ).resolves.toBeUndefined();
    });

    it('matches case-insensitively when caseSensitive is null', async () => {
      await expect(
        checkSecretCodeV2(
          db,
          input(buildTaskV2({ caseSensitive: null }), { code: 'alpha' })
        )
      ).resolves.toBeUndefined();
    });

    it('accepts the exact code when caseSensitive is true', async () => {
      await expect(
        checkSecretCodeV2(
          db,
          input(buildTaskV2({ caseSensitive: true }), { code: 'Alpha' })
        )
      ).resolves.toBeUndefined();
    });

    it('rejects a case mismatch when caseSensitive is true', async () => {
      const error = await applicationError(
        checkSecretCodeV2(
          db,
          input(buildTaskV2({ caseSensitive: true }), { code: 'alpha' })
        )
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'The secret code you entered is incorrect',
        silent: true
      });
    });

    it('rejects a code that matches none of the configured codes', async () => {
      const error = await applicationError(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Charlie' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'The secret code you entered is incorrect',
        silent: true
      });
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('completion check', () => {
    it('looks up an existing completion for the task and participant', async () => {
      await checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }));

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { taskId: 'task-secret-v2', participantId: IDS.participantId }
      });
    });

    it('rejects with BAD_REQUEST when the task was already completed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-secret-v2')
      );

      const error = await applicationError(
        checkSecretCodeV2(db, input(buildTaskV2(), { code: 'Alpha' }))
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Task already completed'
      });
    });
  });
});
