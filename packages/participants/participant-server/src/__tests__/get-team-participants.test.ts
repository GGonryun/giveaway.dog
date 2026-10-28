import { describe, it, expect, beforeEach } from 'vitest';
import { getTeamParticipants } from '../get-team-participants';
import { TEAM_PARTICIPANT_USER_SELECT_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
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

const sortSelect = {
  id: true,
  quality: {
    select: { score: true },
    take: 1,
    orderBy: { updatedAt: 'desc' }
  },
  participation: {
    select: {
      taskCompletions: {
        select: { completedAt: true },
        where: { task: { sweepstakes: { team: { slug: 'acme' } } } },
        orderBy: { completedAt: 'desc' },
        take: 1
      }
    }
  }
};

const sortRow = (
  id: string,
  { score, completedAt }: { score?: number; completedAt: number[] }
) => ({
  id,
  quality: score === undefined ? [] : [{ score }],
  participation: completedAt.map((day) => ({
    taskCompletions: [{ completedAt: new Date(Date.UTC(2026, 0, day)) }]
  }))
});

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

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
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
      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: baseWhere,
        select: sortSelect
      });
    });

    it('counts users with the same filter used for the page', async () => {
      await getTeamParticipants({ slug: 'acme' } as Input);

      expect(prismaMock.user.count).toHaveBeenCalledWith({ where: baseWhere });
    });

    describe('sorting by name', () => {
      it.each(['asc', 'desc'] as const)(
        'orders by name %s with unnamed users last and the id as tie-breaker',
        async (sortDirection) => {
          await getTeamParticipants({
            slug: 'acme',
            sortBy: 'name',
            sortDirection,
            page: 3,
            pageSize: 10
          } as Input);

          expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
          expect(prismaMock.user.findMany).toHaveBeenCalledWith({
            where: baseWhere,
            select: TEAM_PARTICIPANT_USER_SELECT_QUERY({ slug: 'acme' }),
            orderBy: [
              { name: { sort: sortDirection, nulls: 'last' } },
              { id: 'asc' }
            ],
            skip: 20,
            take: 10
          });
        }
      );
    });

    describe('sorting by quality score and last entry', () => {
      const rows = [
        sortRow('b', { score: 50, completedAt: [3] }),
        sortRow('a', { score: 50, completedAt: [1] }),
        sortRow('c', { score: 90, completedAt: [2, 5] }),
        sortRow('d', { score: 120, completedAt: [4] }),
        sortRow('e', { score: -5, completedAt: [] }),
        sortRow('f', { completedAt: [] })
      ];

      const pageOf = async (input: Partial<Input>) => {
        prismaMock.user.findMany
          .mockResolvedValueOnce(rows as never)
          .mockImplementationOnce((async (args: {
            where: { id: { in: string[] } };
          }) =>
            [...args.where.id.in].reverse().map((id) => ({
              ...buildUserRow(),
              id,
              participation: []
            }))) as never);

        const result = await getTeamParticipants({
          slug: 'acme',
          ...input
        } as Input);

        return expectOk(result).participants.map((p) => p.id);
      };

      it.each([
        ['qualityScore', 'desc', ['d', 'c', 'a', 'b', 'e', 'f']],
        ['qualityScore', 'asc', ['e', 'f', 'a', 'b', 'c', 'd']],
        ['lastEntry', 'desc', ['c', 'd', 'b', 'a', 'e', 'f']],
        ['lastEntry', 'asc', ['e', 'f', 'a', 'b', 'd', 'c']]
      ] as const)(
        'orders by %s %s with the id as tie-breaker',
        async (sortBy, sortDirection, expected) => {
          expect(await pageOf({ sortBy, sortDirection })).toEqual(expected);
          expect(prismaMock.user.findMany).toHaveBeenNthCalledWith(1, {
            where: baseWhere,
            select: sortSelect
          });
          expect(prismaMock.user.findMany).toHaveBeenNthCalledWith(2, {
            where: { id: { in: expected } },
            select: TEAM_PARTICIPANT_USER_SELECT_QUERY({ slug: 'acme' })
          });
        }
      );

      it('loads only the users of the requested page', async () => {
        expect(
          await pageOf({
            sortBy: 'qualityScore',
            sortDirection: 'desc',
            page: 2,
            pageSize: 4
          })
        ).toEqual(['e', 'f']);
      });

      it('loads no users for a page past the last one', async () => {
        prismaMock.user.findMany.mockResolvedValueOnce(rows as never);

        const result = await getTeamParticipants({
          slug: 'acme',
          page: 3,
          pageSize: 4
        } as Input);

        expect(expectOk(result).participants).toEqual([]);
        expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      });

      it('leaves out a user that is gone when the page loads', async () => {
        prismaMock.user.findMany
          .mockResolvedValueOnce(rows as never)
          .mockResolvedValueOnce([
            { ...buildUserRow(), id: 'c', participation: [] }
          ] as never);

        const result = await getTeamParticipants({
          slug: 'acme',
          pageSize: 2
        } as Input);

        expect(expectOk(result).participants.map((p) => p.id)).toEqual(['c']);
      });
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
