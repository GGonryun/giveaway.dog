import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import { deleteTaskCompletion } from '../delete-task-completion';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import {
  buildMember,
  buildTeam,
  buildTeamSweepstakes,
  SWEEPSTAKES_ID
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const input = { taskCompletionId: 'tc-1', sweepstakesId: SWEEPSTAKES_ID };

const completion = {
  id: 'tc-1',
  participantId: 'participant-1',
  taskId: 'task-1',
  completedAt: new Date('2026-09-01T00:00:00.000Z'),
  proof: null,
  reason: null,
  status: 'COMPLETED'
};

describe('deleteTaskCompletion', () => {
  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await deleteTaskCompletion(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a missing task completion id', async () => {
      signIn();

      const result = await deleteTaskCompletion({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof deleteTaskCompletion>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller cannot manage the sweepstakes', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the sweepstakes through the caller team membership', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await deleteTaskCompletion(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not accessible', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await deleteTaskCompletion(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({ members: [buildMember({ role: TeamRole.GUEST })] })
        })
      );

      const result = await deleteTaskCompletion(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.taskCompletion.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the task completion does not belong to the sweepstakes', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes()
      );
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
    });

    it('scopes the completion lookup to tasks of the sweepstakes', async () => {
      await deleteTaskCompletion(input);

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { id: 'tc-1', task: { sweepstakesId: SWEEPSTAKES_ID } }
      });
    });

    it('returns NOT_FOUND', async () => {
      const result = await deleteTaskCompletion(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Task completion not found.'
      );
    });

    it('does not delete anything or revalidate the cache', async () => {
      await deleteTaskCompletion(input);

      expect(prismaMock.taskCompletion.delete).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when a member deletes an existing completion', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMember({ role: TeamRole.MEMBER })]
          })
        })
      );
      prismaMock.taskCompletion.findFirst.mockResolvedValue(completion);
      prismaMock.taskCompletion.delete.mockResolvedValue(completion);
    });

    it('returns success', async () => {
      const result = await deleteTaskCompletion(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('deletes the completion by id', async () => {
      await deleteTaskCompletion(input);

      expect(prismaMock.taskCompletion.delete).toHaveBeenCalledWith({
        where: { id: 'tc-1' }
      });
    });

    it('revalidates the sweepstakes cache tag', async () => {
      await deleteTaskCompletion(input);

      expect(nextCacheMock.revalidateTag).toHaveBeenCalledTimes(1);
      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
        `sweepstakes-${SWEEPSTAKES_ID}`,
        'max'
      );
    });
  });

  describe('when the delete fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes()
      );
      prismaMock.taskCompletion.findFirst.mockResolvedValue(completion);
    });

    it('maps a P2025 error to NOT_FOUND without revalidating', async () => {
      prismaMock.taskCompletion.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await deleteTaskCompletion(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
