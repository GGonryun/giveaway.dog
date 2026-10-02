import { describe, it, expect } from 'vitest';
import getUserSweepstakesParticipation from '../get-user-sweepstakes-participation';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';

type Input = Parameters<typeof getUserSweepstakesParticipation>[0];

const bonusTask = (id: string, value: number) => ({
  id,
  sweepstakesId: 'sw-1',
  index: 0,
  config: {
    type: 'BONUS_TASK',
    title: `Task ${id}`,
    value,
    mandatory: false,
    tasksRequired: 0
  }
});

const completion = (
  taskId: string,
  status: 'COMPLETED' | 'PENDING' | 'REJECTED',
  value = 1,
  proof: unknown = null
) => ({
  id: `c-${taskId}`,
  participantId: 'participant-1',
  taskId,
  status,
  proof,
  completedAt: new Date('2026-01-01T00:00:00.000Z'),
  reason: null,
  task: bonusTask(taskId, value)
});

const signedInWithProfile = () => {
  signIn();
  prismaMock.user.findUnique.mockResolvedValue({ id: TEST_USER.id });
};

describe('getUserSweepstakesParticipation', () => {
  describe('when the caller is anonymous', () => {
    it('returns undefined without touching the database', async () => {
      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller has no profile', () => {
    it('returns NOT_FOUND asking the user to update their settings', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'User profile does not exist. Update any of your account settings to continue.'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller has a profile', () => {
    it('looks up the profile by the session user id', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id }
      });
    });

    it('queries the caller task completions for the sweepstakes by id or slug', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getUserSweepstakesParticipation({ id: 'summer' });

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participant: { userId: TEST_USER.id },
          task: {
            sweepstakes: {
              OR: [{ id: 'summer' }, { visibility: { slug: 'summer' } }]
            }
          }
        },
        include: { task: true }
      });
    });

    it('returns zero entries and no submissions when nothing was completed', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)).toEqual({ entries: 0, submissions: [] });
    });

    it('sums task values of COMPLETED submissions only', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('t-1', 'COMPLETED', 3),
        completion('t-2', 'COMPLETED', 5),
        completion('t-3', 'PENDING', 7),
        completion('t-4', 'REJECTED', 11)
      ]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)?.entries).toBe(8);
    });

    it('lists every submission with its task id and status in query order', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('t-1', 'COMPLETED'),
        completion('t-2', 'PENDING'),
        completion('t-3', 'REJECTED')
      ]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)?.submissions).toEqual([
        { taskId: 't-1', status: 'COMPLETED' },
        { taskId: 't-2', status: 'PENDING' },
        { taskId: 't-3', status: 'REJECTED' }
      ]);
    });

    it('ignores the verified bonus of imported twitter tasks', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        {
          ...completion('t-1', 'COMPLETED'),
          proof: {
            source: 'twitter_import',
            twitterUserId: '1',
            twitterUsername: 'someone',
            twitterVerified: true,
            importedAt: '2026-01-01',
            validatedBy: 'system'
          },
          task: {
            id: 't-1',
            sweepstakesId: 'sw-1',
            index: 0,
            config: {
              type: 'TWITTER_LIKE_IMPORT',
              title: 'Like',
              value: 2,
              mandatory: false,
              tasksRequired: 0,
              tweetId: 'https://x.com/someone/status/123',
              importingAccount: 'acct',
              verifiedBonus: 10
            }
          }
        }
      ]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)?.entries).toBe(2);
    });

    it('does not parse task configs of non-completed submissions', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        {
          ...completion('t-1', 'PENDING'),
          task: { id: 't-1', sweepstakesId: 'sw-1', index: 0, config: null }
        }
      ]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectOk(result)).toEqual({
        entries: 0,
        submissions: [{ taskId: 't-1', status: 'PENDING' }]
      });
    });

    it('returns INTERNAL_SERVER_ERROR when a completed task has an invalid config', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        {
          ...completion('t-1', 'COMPLETED'),
          task: { id: 't-1', sweepstakesId: 'sw-1', index: 0, config: {} }
        }
      ]);

      const result = await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });

    it('does not cache or revalidate anything', async () => {
      signedInWithProfile();
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getUserSweepstakesParticipation({ id: 'sw-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when id is missing', async () => {
      signIn();

      const result = await getUserSweepstakesParticipation(
        {} as unknown as Input
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
