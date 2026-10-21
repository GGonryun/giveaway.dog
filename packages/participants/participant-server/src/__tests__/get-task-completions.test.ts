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
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

const input = { slug: 'acme', userId: 'user-2' };

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | 'BLOCKED';

const team = (role: Role = 'OWNER') =>
  ({
    id: 'team-1',
    slug: 'acme',
    tier: 'FREE',
    members: [{ userId: TEST_USER.id, teamId: 'team-1', role }]
  }) as never;

describe('getTaskCompletions', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getTaskCompletions(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is not a member of the team', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the team of the slug among the memberships of the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      await getTaskCompletions(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('[TEAM-004] returns NOT_FOUND without reading the completions', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getTaskCompletions(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN to a blocked member without reading the completions', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team('BLOCKED'));

      const result = await getTaskCompletions(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toContain(
        'VIEW_SWEEPSTAKES'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team('GUEST'));
    });

    it('rejects input without a user id', async () => {
      const result = await getTaskCompletions({
        slug: 'acme'
      } as unknown as Parameters<typeof getTaskCompletions>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects input without a slug', async () => {
      const result = await getTaskCompletions({
        userId: 'user-2'
      } as unknown as Parameters<typeof getTaskCompletions>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('[TEAM-004] queries completions of the user only in sweepstakes of the team of the slug', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getTaskCompletions(input);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participant: { user: { id: 'user-2' } },
          task: { sweepstakes: { teamId: 'team-1' } }
        },
        select: TASK_COMPLETIONS_SELECT_QUERY
      });
    });

    it('returns an empty list when there are no completions', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getTaskCompletions(input);

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

      const result = await getTaskCompletions(input);

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
