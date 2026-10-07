import { describe, it, expect, beforeEach } from 'vitest';
import { getTeamParticipants } from '../get-team-participants';
import { TEAM_PARTICIPANT_USER_SELECT_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildTeam } from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  buildCompletion,
  buildCompletionRow,
  buildUserRow,
  buildUserSchema
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

type Input = Parameters<typeof getTeamParticipants>[0];

const baseWhere = {
  participation: {
    some: {
      taskCompletions: {
        some: {
          task: {
            sweepstakes: {
              team: {
                slug: 'acme',
                members: { some: { userId: TEST_USER.id } }
              }
            }
          }
        }
      }
    }
  }
};

const lastWhere = () => prismaMock.user.findMany.mock.calls[0][0].where;

describe('getTeamParticipants', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getTeamParticipants({ slug: 'acme' } as Input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.count).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is a member of the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.user.count.mockResolvedValue(0);
      prismaMock.user.findMany.mockResolvedValue([]);
    });

    describe('input validation', () => {
      it.each([
        ['a page below 1', { page: 0 }],
        ['a page size below 1', { pageSize: 0 }],
        ['a page size above 100', { pageSize: 101 }],
        ['a negative minimum quality score', { minQualityScore: -1 }],
        ['a maximum quality score above 100', { maxQualityScore: 101 }],
        ['an unknown source', { sources: ['WEBSITE'] }],
        ['an unknown sort field', { sortBy: 'email' }],
        ['an unknown sort direction', { sortDirection: 'up' }],
        ['a missing slug', { slug: undefined }]
      ])('rejects %s', async (_label, overrides) => {
        const result = await getTeamParticipants({
          slug: 'acme',
          ...overrides
        } as unknown as Input);

        expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(prismaMock.user.count).not.toHaveBeenCalled();
      });

      it('accepts the boundary values for page size and quality scores', async () => {
        const result = await getTeamParticipants({
          slug: 'acme',
          pageSize: 100,
          minQualityScore: 0,
          maxQualityScore: 100
        } as Input);

        expectOk(result);
      });
    });

    it('defaults to the first page of 50 participants', async () => {
      const result = await getTeamParticipants({ slug: 'acme' } as Input);

      expect(expectOk(result)).toEqual({
        participants: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0
      });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: baseWhere,
        select: TEAM_PARTICIPANT_USER_SELECT_QUERY({ slug: 'acme' }),
        skip: 0,
        take: 50
      });
    });

    it('counts users with the same filter used for the page', async () => {
      await getTeamParticipants({ slug: 'acme' } as Input);

      expect(prismaMock.user.count).toHaveBeenCalledWith({ where: baseWhere });
    });

    it('skips the rows of previous pages', async () => {
      await getTeamParticipants({
        slug: 'acme',
        page: 3,
        pageSize: 10
      } as Input);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('ignores the sort options when querying', async () => {
      await getTeamParticipants({
        slug: 'acme',
        sortBy: 'name',
        sortDirection: 'asc'
      } as Input);

      expect(prismaMock.user.findMany.mock.calls[0][0]).not.toHaveProperty(
        'orderBy'
      );
    });

    it('searches name, email and id case-insensitively', async () => {
      await getTeamParticipants({ slug: 'acme', search: 'jan' } as Input);

      expect(lastWhere()).toEqual({
        ...baseWhere,
        OR: [
          { name: { contains: 'jan', mode: 'insensitive' } },
          { email: { contains: 'jan', mode: 'insensitive' } },
          { id: { contains: 'jan', mode: 'insensitive' } }
        ]
      });
    });

    it('does not search when the search text is empty', async () => {
      await getTeamParticipants({ slug: 'acme', search: '' } as Input);

      expect(lastWhere()).toEqual(baseWhere);
    });

    it('filters by user source when sources are given', async () => {
      await getTeamParticipants({
        slug: 'acme',
        sources: ['SIGNUP', 'TWITTER_IMPORT']
      } as Input);

      expect(lastWhere()).toEqual({
        ...baseWhere,
        source: { in: ['SIGNUP', 'TWITTER_IMPORT'] }
      });
    });

    it('does not filter by source for an empty source list', async () => {
      const sources: Input['sources'] = [];

      await getTeamParticipants({ slug: 'acme', sources } as Input);

      expect(lastWhere()).toEqual(baseWhere);
    });

    it('filters by a minimum quality score, including zero', async () => {
      await getTeamParticipants({ slug: 'acme', minQualityScore: 0 } as Input);

      expect(lastWhere()).toEqual({
        ...baseWhere,
        quality: { some: { score: { gte: 0 } } }
      });
    });

    it('filters by a maximum quality score', async () => {
      await getTeamParticipants({ slug: 'acme', maxQualityScore: 70 } as Input);

      expect(lastWhere()).toEqual({
        ...baseWhere,
        quality: { some: { score: { lte: 70 } } }
      });
    });

    it('filters by a quality score range', async () => {
      await getTeamParticipants({
        slug: 'acme',
        minQualityScore: 20,
        maxQualityScore: 80
      } as Input);

      expect(lastWhere()).toEqual({
        ...baseWhere,
        quality: { some: { score: { gte: 20, lte: 80 } } }
      });
    });

    it('combines search, source and quality filters', async () => {
      await getTeamParticipants({
        slug: 'acme',
        search: 'x',
        sources: ['ANONYMOUS'],
        maxQualityScore: 10
      } as Input);

      expect(Object.keys(lastWhere()).sort()).toEqual([
        'OR',
        'participation',
        'quality',
        'source'
      ]);
    });

    it('returns mapped participants with the total and page count', async () => {
      prismaMock.user.count.mockResolvedValue(51);
      prismaMock.user.findMany.mockResolvedValue([
        {
          ...buildUserRow(),
          participation: [{ taskCompletions: [buildCompletionRow()] }]
        }
      ]);

      const result = await getTeamParticipants({ slug: 'acme' } as Input);

      expect(expectOk(result)).toEqual({
        participants: [
          {
            id: 'user-2',
            user: buildUserSchema(),
            allocation: null,
            completions: [buildCompletion()],
            formValues: {}
          }
        ],
        total: 51,
        page: 1,
        pageSize: 50,
        totalPages: 2
      });
    });

    it('echoes the requested page and page size in the result', async () => {
      prismaMock.user.count.mockResolvedValue(25);

      const result = await getTeamParticipants({
        slug: 'acme',
        page: 3,
        pageSize: 10
      } as Input);

      expect(expectOk(result)).toEqual({
        participants: [],
        total: 25,
        page: 3,
        pageSize: 10,
        totalPages: 3
      });
    });

    it('reports an exact page count when the total divides evenly', async () => {
      prismaMock.user.count.mockResolvedValue(30);

      const result = await getTeamParticipants({
        slug: 'acme',
        pageSize: 10
      } as Input);

      expect(expectOk(result).totalPages).toBe(3);
    });
  });
});
