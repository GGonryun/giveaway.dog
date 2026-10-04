import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompletionStatus, TeamRole } from '@prisma/client';
import { reverifyTaskCompletion } from '../reverify-task-completion';
import { ApplicationError } from '@giveaway/util-errors';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  SWEEPSTAKES_ID,
  TEAM_ID,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-b';

const mocks = vi.hoisted(() => ({ validateTask: vi.fn() }));

vi.mock('@giveaway/task-validation/integrations', () => ({
  validateTask: mocks.validateTask
}));

type Input = Parameters<typeof reverifyTaskCompletion>[0];

const NOW = new Date('2025-06-15T12:00:00.000Z');
const INPUT: Input = {
  taskCompletionId: 'completion-1',
  sweepstakesId: SWEEPSTAKES_ID
};

const SECRET_CODE_CONFIG = {
  type: 'SECRET_CODE',
  title: 'Enter the code',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  code: 'woof'
};

const VISIT_URL_CONFIG = {
  type: 'VISIT_URL',
  title: 'Visit our site',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  href: 'https://example.com',
  label: 'Visit'
};

const buildCompletion = ({
  config = SECRET_CODE_CONFIG,
  proof = { code: 'woof' }
}: {
  config?: Record<string, unknown> | null;
  proof?: unknown;
} = {}) => ({
  id: 'completion-1',
  taskId: 'task-1',
  participantId: 'participant-1',
  proof,
  status: CompletionStatus.PENDING,
  task: { id: 'task-1', sweepstakesId: SWEEPSTAKES_ID, index: 0, config },
  participant: {
    id: 'participant-1',
    userId: 'entrant-1',
    user: { id: 'entrant-1' }
  }
});

const updateData = () => prismaMock.taskCompletion.update.mock.calls[0][0];

describe('reverifyTaskCompletion', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.validateTask.mockReset();
    mocks.validateTask.mockResolvedValue(undefined);
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    prismaMock.taskCompletion.findFirst.mockResolvedValue(buildCompletion());
    prismaMock.taskCompletion.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('access control', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects input without a task completion id', async () => {
      signIn();

      const result = await reverifyTaskCompletion({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"taskCompletionId"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects input without a sweepstakes id', async () => {
      signIn();

      const result = await reverifyTaskCompletion({
        taskCompletionId: 'completion-1'
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"sweepstakesId"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes from the input sweepstakes id scoped to the caller', async () => {
      signIn();

      await reverifyTaskCompletion(INPUT);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not visible to the caller', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a blocked member', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.BLOCKED })]
          })
        })
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: VIEW_SWEEPSTAKES'
      );
    });

    it('lets a view only guest re-verify and update a completion', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectOk(result).success).toBe(true);
      expect(prismaMock.taskCompletion.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('looking up the completion', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the completion within the sweepstakes with its task and participant', async () => {
      await reverifyTaskCompletion(INPUT);

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'completion-1',
          task: { sweepstakesId: SWEEPSTAKES_ID }
        },
        include: {
          task: true,
          participant: { include: { user: true } }
        }
      });
    });

    it('returns NOT_FOUND when the completion does not exist', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Task completion not found.'
      );
      expect(mocks.validateTask).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR when the task config cannot be parsed', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        buildCompletion({ config: { type: 'UNKNOWN' } })
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR for tasks that require manual verification', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        buildCompletion({ config: VISIT_URL_CONFIG })
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'This task does not support automated verification. Please use manual verification.'
      );
      expect(mocks.validateTask).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });
  });

  describe('when verification succeeds', () => {
    beforeEach(() => {
      signIn();
    });

    it('validates the parsed task against the stored proof', async () => {
      await reverifyTaskCompletion(INPUT);

      expect(mocks.validateTask).toHaveBeenCalledWith(asPrismaClient(), {
        task: {
          ...SECRET_CODE_CONFIG,
          id: 'task-1',
          caseSensitive: false
        },
        userId: 'entrant-1',
        participantId: 'participant-1',
        teamId: TEAM_ID,
        data: { code: 'woof' }
      });
    });

    it('marks the completion completed and records the reverification', async () => {
      await reverifyTaskCompletion(INPUT);

      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: {
          status: CompletionStatus.COMPLETED,
          proof: {
            code: 'woof',
            reverificationHistory: [
              {
                verifiedAt: NOW.toISOString(),
                success: true,
                status: 'COMPLETED'
              }
            ]
          }
        }
      });
    });

    it('returns a successful COMPLETED result', async () => {
      const result = await reverifyTaskCompletion(INPUT);

      expect(expectOk(result)).toEqual({
        success: true,
        status: CompletionStatus.COMPLETED
      });
    });

    it('appends to an existing reverification history', async () => {
      const previous = {
        verifiedAt: '2025-01-01T00:00:00.000Z',
        success: false,
        status: 'REJECTED',
        error: 'old'
      };
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        buildCompletion({
          proof: { code: 'woof', reverificationHistory: [previous] }
        })
      );

      await reverifyTaskCompletion(INPUT);

      expect(updateData().data.proof.reverificationHistory).toEqual([
        previous,
        { verifiedAt: NOW.toISOString(), success: true, status: 'COMPLETED' }
      ]);
    });

    it('treats a missing proof as an empty object', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        buildCompletion({ proof: null })
      );

      await reverifyTaskCompletion(INPUT);

      expect(mocks.validateTask.mock.calls[0][1].data).toEqual({});
      expect(updateData().data.proof).toEqual({
        reverificationHistory: [
          { verifiedAt: NOW.toISOString(), success: true, status: 'COMPLETED' }
        ]
      });
    });

    it('does not invalidate any cache tags', async () => {
      await reverifyTaskCompletion(INPUT);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when verification fails', () => {
    beforeEach(() => {
      signIn();
    });

    it('marks the completion rejected and records the error', async () => {
      mocks.validateTask.mockRejectedValue(new Error('Code does not match'));

      await reverifyTaskCompletion(INPUT);

      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: {
          status: CompletionStatus.REJECTED,
          proof: {
            code: 'woof',
            reverificationHistory: [
              {
                verifiedAt: NOW.toISOString(),
                success: false,
                status: 'REJECTED',
                error: 'Code does not match'
              }
            ],
            lastVerificationError: 'Code does not match'
          }
        }
      });
    });

    it('returns an unsuccessful REJECTED result with the error message', async () => {
      mocks.validateTask.mockRejectedValue(
        new ApplicationError({ code: 'BAD_REQUEST', message: 'Not following' })
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectOk(result)).toEqual({
        success: false,
        status: CompletionStatus.REJECTED,
        error: 'Not following'
      });
    });

    it('uses a generic message when a non error value is thrown', async () => {
      mocks.validateTask.mockRejectedValue('nope');

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectOk(result).error).toBe('Verification failed');
      expect(updateData().data.proof.lastVerificationError).toBe(
        'Verification failed'
      );
    });

    it('records a failed database write on the success path as a rejection', async () => {
      prismaMock.taskCompletion.update
        .mockRejectedValueOnce(new Error('write failed'))
        .mockResolvedValueOnce({});

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectOk(result)).toEqual({
        success: false,
        status: CompletionStatus.REJECTED,
        error: 'write failed'
      });
      expect(
        prismaMock.taskCompletion.update.mock.calls[1][0].data.proof
          .reverificationHistory
      ).toEqual([
        { verifiedAt: NOW.toISOString(), success: true, status: 'COMPLETED' },
        {
          verifiedAt: NOW.toISOString(),
          success: false,
          status: 'REJECTED',
          error: 'write failed'
        }
      ]);
    });

    it('returns INTERNAL_SERVER_ERROR when recording the rejection fails', async () => {
      mocks.validateTask.mockRejectedValue(new Error('Code does not match'));
      prismaMock.taskCompletion.update.mockRejectedValue(
        new Error('write failed')
      );

      const result = await reverifyTaskCompletion(INPUT);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'write failed'
      );
    });
  });
});
