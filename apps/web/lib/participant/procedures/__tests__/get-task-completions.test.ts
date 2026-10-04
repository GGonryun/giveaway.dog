import { describe, it, expect, beforeEach } from 'vitest';
import { getTaskCompletions } from '../get-task-completions';
import { TASK_COMPLETIONS_SELECT_QUERY } from '@giveaway/task-model/completions';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  buildCompletion,
  buildCompletionRow,
  daysAfterBase
} from '../../__tests__/fixtures-participant-referrals-automation';

describe('getTaskCompletions', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getTaskCompletions({ userId: 'user-2' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a user id', async () => {
      const result = await getTaskCompletions(
        {} as unknown as Parameters<typeof getTaskCompletions>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('queries completions of the user in sweepstakes of teams the caller belongs to', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getTaskCompletions({ userId: 'user-2' });

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participant: { user: { id: 'user-2' } },
          task: {
            sweepstakes: {
              team: { members: { some: { userId: TEST_USER.id } } }
            }
          }
        },
        select: TASK_COMPLETIONS_SELECT_QUERY
      });
    });

    it('returns an empty list when there are no completions', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getTaskCompletions({ userId: 'user-2' });

      expect(expectOk(result)).toEqual([]);
    });

    it('maps completions in query order', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        buildCompletionRow({ id: 'a', completedAt: daysAfterBase(1) }),
        buildCompletionRow({
          id: 'b',
          completedAt: daysAfterBase(2),
          status: 'PENDING',
          proof: { url: 'https://example.com' }
        })
      ]);

      const result = await getTaskCompletions({ userId: 'user-2' });

      expect(expectOk(result)).toEqual([
        buildCompletion({ id: 'a', completedAt: daysAfterBase(1) }),
        buildCompletion({
          id: 'b',
          completedAt: daysAfterBase(2),
          status: 'PENDING',
          proof: { url: 'https://example.com' }
        })
      ]);
    });
  });
});
