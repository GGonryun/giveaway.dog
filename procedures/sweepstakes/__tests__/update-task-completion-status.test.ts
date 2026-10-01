import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompletionStatus, TeamRole } from '@prisma/client';
import { updateTaskCompletionStatus } from '../update-task-completion-status';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  SWEEPSTAKES_ID,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes
} from './fixtures-procedures-sweepstakes-b';

type Input = Parameters<typeof updateTaskCompletionStatus>[0];

const NOW = new Date('2025-06-15T12:00:00.000Z');

const input = (overrides: Partial<Input> = {}): Input => ({
  taskCompletionId: 'completion-1',
  sweepstakesId: SWEEPSTAKES_ID,
  status: CompletionStatus.COMPLETED,
  ...overrides
});

const completion = (proof: unknown = { code: 'woof' }) => ({
  id: 'completion-1',
  taskId: 'task-1',
  participantId: 'participant-1',
  status: CompletionStatus.PENDING,
  reason: null,
  proof
});

const updateArgs = () => prismaMock.taskCompletion.update.mock.calls[0][0];

describe('updateTaskCompletionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    prismaMock.taskCompletion.findFirst.mockResolvedValue(completion());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('access control', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await updateTaskCompletionStatus(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown completion status', async () => {
      signIn();

      const result = await updateTaskCompletionStatus(
        input({ status: 'APPROVED' } as unknown as Partial<Input>)
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"status"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non string reason', async () => {
      signIn();

      const result = await updateTaskCompletionStatus(
        input({ reason: 42 } as unknown as Partial<Input>)
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"reason"/
      );
    });

    it('rejects input without a task completion id', async () => {
      signIn();

      const result = await updateTaskCompletionStatus(
        input({ taskCompletionId: undefined })
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"taskCompletionId"/
      );
    });

    it('loads the sweepstakes from the input sweepstakes id scoped to the caller', async () => {
      signIn();

      await updateTaskCompletionStatus(input());

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not accessible', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await updateTaskCompletionStatus(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest member', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      const result = await updateTaskCompletionStatus(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.taskCompletion.update).not.toHaveBeenCalled();
    });
  });

  describe('looking up the completion', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the completion within the sweepstakes', async () => {
      await updateTaskCompletionStatus(input());

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'completion-1',
          task: { sweepstakesId: SWEEPSTAKES_ID }
        }
      });
    });

    it('returns NOT_FOUND when the completion does not exist', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      const result = await updateTaskCompletionStatus(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Task completion not found.'
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('approving a completion', () => {
    beforeEach(() => {
      signIn();
    });

    it('marks it completed, clears the reason and appends to the history', async () => {
      const result = await updateTaskCompletionStatus(
        input({ status: CompletionStatus.COMPLETED, reason: 'looks good' })
      );

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.taskCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: {
          status: CompletionStatus.COMPLETED,
          reason: null,
          proof: {
            code: 'woof',
            verificationHistory: [
              {
                status: CompletionStatus.COMPLETED,
                verifiedAt: NOW.toISOString(),
                reason: 'looks good'
              }
            ]
          }
        }
      });
    });

    it('does not touch prize draws', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.COMPLETED })
      );

      expect(prismaMock.prizeDraw.updateMany).not.toHaveBeenCalled();
    });

    it('runs the update inside a transaction', async () => {
      await updateTaskCompletionStatus(input());

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('records a null reason in the history when none is given', async () => {
      await updateTaskCompletionStatus(input());

      expect(updateArgs().data.proof.verificationHistory).toEqual([
        {
          status: CompletionStatus.COMPLETED,
          verifiedAt: NOW.toISOString(),
          reason: null
        }
      ]);
    });

    it('appends to an existing verification history', async () => {
      const previous = {
        status: CompletionStatus.PENDING,
        verifiedAt: '2025-01-01T00:00:00.000Z',
        reason: null
      };
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        completion({ code: 'woof', verificationHistory: [previous] })
      );

      await updateTaskCompletionStatus(input());

      expect(updateArgs().data.proof.verificationHistory).toEqual([
        previous,
        {
          status: CompletionStatus.COMPLETED,
          verifiedAt: NOW.toISOString(),
          reason: null
        }
      ]);
    });

    it('treats a missing proof as an empty object', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(completion(null));

      await updateTaskCompletionStatus(input());

      expect(updateArgs().data.proof).toEqual({
        verificationHistory: [
          {
            status: CompletionStatus.COMPLETED,
            verifiedAt: NOW.toISOString(),
            reason: null
          }
        ]
      });
    });
  });

  describe('rejecting a completion', () => {
    beforeEach(() => {
      signIn();
    });

    it('stores the rejection reason on the completion', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED, reason: 'Fake account' })
      );

      expect(updateArgs().data).toMatchObject({
        status: CompletionStatus.REJECTED,
        reason: 'Fake account'
      });
    });

    it('disqualifies winning prize draws tied to the completion', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED, reason: '  Fake account  ' })
      );

      expect(prismaMock.prizeDraw.updateMany).toHaveBeenCalledWith({
        where: { taskCompletionId: 'completion-1', result: 'WINNER' },
        data: {
          result: 'DISQUALIFIED',
          disqualificationReason: 'Entry rejected: Fake account'
        }
      });
    });

    it('stores the untrimmed reason on the completion', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED, reason: '  Fake account  ' })
      );

      expect(updateArgs().data.reason).toBe('  Fake account  ');
    });

    it('uses a placeholder disqualification reason when none is given', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED })
      );

      expect(updateArgs().data.reason).toBeNull();
      expect(prismaMock.prizeDraw.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            result: 'DISQUALIFIED',
            disqualificationReason: 'Entry rejected: No reason provided'
          }
        })
      );
    });

    it('uses the placeholder when the reason is only whitespace', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED, reason: '   ' })
      );

      expect(updateArgs().data.reason).toBe('   ');
      expect(
        prismaMock.prizeDraw.updateMany.mock.calls[0][0].data
          .disqualificationReason
      ).toBe('Entry rejected: No reason provided');
    });

    it('disqualifies prize draws after updating the completion', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED })
      );

      expect(
        prismaMock.taskCompletion.update.mock.invocationCallOrder[0]
      ).toBeLessThan(
        prismaMock.prizeDraw.updateMany.mock.invocationCallOrder[0]
      );
    });

    it('returns INTERNAL_SERVER_ERROR when disqualifying draws fails', async () => {
      prismaMock.prizeDraw.updateMany.mockRejectedValue(new Error('tx failed'));

      const result = await updateTaskCompletionStatus(
        input({ status: CompletionStatus.REJECTED })
      );

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'tx failed'
      );
    });
  });

  describe('moving a completion back to pending', () => {
    beforeEach(() => {
      signIn();
    });

    it('keeps the supplied reason and leaves prize draws alone', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.PENDING, reason: 'Needs review' })
      );

      expect(updateArgs().data).toMatchObject({
        status: CompletionStatus.PENDING,
        reason: 'Needs review'
      });
      expect(prismaMock.prizeDraw.updateMany).not.toHaveBeenCalled();
    });

    it('stores a null reason when none is supplied', async () => {
      await updateTaskCompletionStatus(
        input({ status: CompletionStatus.PENDING, reason: '' })
      );

      expect(updateArgs().data.reason).toBeNull();
    });
  });
});
