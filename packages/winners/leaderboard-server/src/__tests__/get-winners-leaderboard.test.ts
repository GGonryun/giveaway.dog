import { describe, it, expect } from 'vitest';
import getWinnersLeaderboard from '../get-winners-leaderboard';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof getWinnersLeaderboard>[0];

type PartialInput = { page?: number; limit?: number; search?: string };

const callWithPartialInput = (input: PartialInput) =>
  getWinnersLeaderboard(input as Input);

const WON_AT = new Date('2026-05-01T12:00:00.000Z');

const aggregateRow = (
  userId: string,
  winCount: bigint,
  overrides: Partial<{
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
  }> = {}
) => ({
  userId,
  userName: `Name ${userId}`,
  userEmail: `${userId}@example.com`,
  userImage: null,
  winCount,
  ...overrides
});

type DrawFixture = {
  createdAt: Date;
  prize: {
    name: string | null;
    sweepstakes: {
      id: string;
      details: { name: string | null } | null;
      visibility: { slug: string | null } | null;
      team: { slug: string } | null;
    };
  };
};

const draw = (
  sweepstakesId: string,
  overrides: Partial<DrawFixture['prize']['sweepstakes']> = {},
  prizeName: string | null = 'Gift Card'
): DrawFixture => ({
  createdAt: WON_AT,
  prize: {
    name: prizeName,
    sweepstakes: {
      id: sweepstakesId,
      details: { name: `Giveaway ${sweepstakesId}` },
      visibility: { slug: `slug-${sweepstakesId}` },
      team: { slug: 'acme' },
      ...overrides
    }
  }
});

const userWins = (id: string, participations: DrawFixture[][][]) => ({
  id,
  participation: participations.map((taskCompletions) => ({
    taskCompletions: taskCompletions.map((draws) => ({ draws }))
  }))
});

const rawCall = () => {
  const [strings, ...values] = prismaMock.$queryRaw.mock.calls[0] as [
    TemplateStringsArray,
    ...unknown[]
  ];
  return { sql: strings.join('?'), values };
};

const normalizedSql = () => rawCall().sql.replace(/\s+/g, ' ').trim();

const SELECT_AND_JOINS = [
  'SELECT u.id as "userId", u.name as "userName", u.email as "userEmail", u.image as "userImage", COUNT(DISTINCT d.id) as "winCount"',
  'FROM "User" u',
  'INNER JOIN "Participant" p ON p."userId" = u.id',
  'INNER JOIN "TaskCompletion" tc ON tc."participantId" = p.id',
  'INNER JOIN "PrizeDraw" d ON d."taskCompletionId" = tc.id',
  'INNER JOIN "Prize" pr ON pr.id = d."prizeId"',
  'INNER JOIN "Sweepstakes" s ON s.id = pr."sweepstakesId"',
  'INNER JOIN "SweepstakesVisibility" sv ON sv."sweepstakesId" = s.id',
  "WHERE d.result = 'WINNER' AND sv.visibility = 'PUBLIC'"
].join(' ');

const GROUP_ORDER_PAGE = [
  'GROUP BY u.id, u.name, u.email, u.image',
  'ORDER BY "winCount" DESC, u.id ASC',
  'LIMIT ? OFFSET ?'
].join(' ');

describe('getWinnersLeaderboard', () => {
  describe('aggregate query', () => {
    it('uses page 1 and a limit of 25 when no input is given', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard(undefined);

      expect(rawCall().values).toEqual([25, 0]);
    });

    it('applies the schema defaults when an empty object is given', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({});

      expect(rawCall().values).toEqual([25, 0]);
    });

    it('offsets by the previous pages using the requested limit', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard({ page: 3, limit: 10 });

      expect(rawCall().values).toEqual([10, 20]);
    });

    it('counts distinct public WINNER draws per user ordered by wins then id', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard(undefined);

      const { sql } = rawCall();
      expect(sql).toContain('COUNT(DISTINCT d.id) as "winCount"');
      expect(sql).toContain("WHERE d.result = 'WINNER'");
      expect(sql).toContain("AND sv.visibility = 'PUBLIC'");
      expect(sql).toContain('ORDER BY "winCount" DESC, u.id ASC');
      expect(sql).not.toContain('LIKE');
    });

    it('runs the exact unfiltered aggregate SQL when there is no search', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard(undefined);

      expect(normalizedSql()).toBe(`${SELECT_AND_JOINS} ${GROUP_ORDER_PAGE}`);
    });

    it('filters by a case-insensitive name match when a search is given', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: 'Bob' });

      const { sql, values } = rawCall();
      expect(sql).toContain('AND LOWER(u.name) LIKE LOWER(?)');
      expect(values).toEqual(['%Bob%', 25, 0]);
    });

    it('runs the exact search aggregate SQL with the name filter after the public winner conditions', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: 'Bob' });

      expect(normalizedSql()).toBe(
        `${SELECT_AND_JOINS} AND LOWER(u.name) LIKE LOWER(?) ${GROUP_ORDER_PAGE}`
      );
    });

    it('applies the page and limit to the search query as well', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard({ page: 4, limit: 5, search: 'al' });

      expect(rawCall().values).toEqual(['%al%', 5, 15]);
    });

    it('trims the search term before matching', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: '  Bob  ' });

      expect(rawCall().values[0]).toBe('%Bob%');
    });

    it('does not escape LIKE wildcards in the search term', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: '50%_off' });

      expect(rawCall().values[0]).toBe('%50%_off%');
    });

    it('runs the unfiltered query when the search is only whitespace', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: '   ' });

      const { sql, values } = rawCall();
      expect(sql).not.toContain('LIKE');
      expect(values).toEqual([25, 0]);
    });

    it('runs the unfiltered query when the search is empty', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await callWithPartialInput({ search: '' });

      expect(rawCall().sql).not.toContain('LIKE');
    });
  });

  describe('cache configuration', () => {
    it('uses default key parts when no input is given', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard(undefined);

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['winners-leaderboard', '1', '25', 'no-search'],
        { tags: ['winners-leaderboard'], revalidate: 3600 }
      );
    });

    it('builds key parts from page, limit and the untrimmed search', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await getWinnersLeaderboard({ page: 2, limit: 50, search: ' Bob ' });

      expect(nextCacheMock.unstable_cache.mock.calls[0][1]).toEqual([
        'winners-leaderboard',
        '2',
        '50',
        ' Bob '
      ]);
    });
  });

  describe('when there are no winners', () => {
    it('returns an empty list without loading individual wins', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)).toEqual([]);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when there are winners', () => {
    it('loads the public wins of the aggregated users only', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        aggregateRow('u-1', BigInt(2)),
        aggregateRow('u-2', BigInt(1))
      ]);
      prismaMock.user.findMany.mockResolvedValue([]);

      await getWinnersLeaderboard(undefined);

      const publicWinner = {
        result: 'WINNER',
        prize: {
          sweepstakes: { visibility: { visibility: 'PUBLIC' } }
        }
      };
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['u-1', 'u-2'] } },
        select: {
          id: true,
          participation: {
            select: {
              taskCompletions: {
                where: { draws: { some: publicWinner } },
                select: {
                  draws: {
                    where: publicWinner,
                    select: {
                      createdAt: true,
                      prize: {
                        select: {
                          name: true,
                          sweepstakes: {
                            select: {
                              id: true,
                              details: { select: { name: true } },
                              visibility: { select: { slug: true } },
                              team: { select: { slug: true } }
                            }
                          }
                        }
                      }
                    },
                    orderBy: { createdAt: 'desc' }
                  }
                }
              }
            }
          }
        }
      });
    });

    it('maps each winner with a numeric win count and flattened wins', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        aggregateRow('u-1', BigInt(3), {
          userName: 'Alice',
          userEmail: 'alice@example.com',
          userImage: 'https://example.com/alice.png'
        })
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        userWins('u-1', [[[draw('sw-1'), draw('sw-2')], [draw('sw-3')]]])
      ]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)).toEqual([
        {
          userId: 'u-1',
          userName: 'Alice',
          userEmail: 'alice@example.com',
          userImage: 'https://example.com/alice.png',
          winCount: 3,
          wins: ['sw-1', 'sw-2', 'sw-3'].map((id) => ({
            sweepstakesId: id,
            sweepstakesName: `Giveaway ${id}`,
            sweepstakesSlug: `slug-${id}`,
            teamSlug: 'acme',
            prizeName: 'Gift Card',
            wonAt: WON_AT
          }))
        }
      ]);
    });

    it('exposes the winner email even though the output schema omits it', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        aggregateRow('u-1', BigInt(1), { userEmail: 'private@example.com' })
      ]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)[0]).toHaveProperty(
        'userEmail',
        'private@example.com'
      );
    });

    it('flattens wins across several participations', async () => {
      prismaMock.$queryRaw.mockResolvedValue([aggregateRow('u-1', BigInt(2))]);
      prismaMock.user.findMany.mockResolvedValue([
        userWins('u-1', [[[draw('sw-a')]], [[draw('sw-b')]]])
      ]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)[0].wins.map((win) => win.sweepstakesId)).toEqual([
        'sw-a',
        'sw-b'
      ]);
    });

    it('falls back to placeholder names and empty slugs when related rows are missing', async () => {
      prismaMock.$queryRaw.mockResolvedValue([aggregateRow('u-1', BigInt(1))]);
      prismaMock.user.findMany.mockResolvedValue([
        userWins('u-1', [
          [
            [
              draw(
                'sw-1',
                { details: null, visibility: null, team: null },
                null
              )
            ]
          ]
        ])
      ]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)[0].wins).toEqual([
        {
          sweepstakesId: 'sw-1',
          sweepstakesName: 'Unnamed Giveaway',
          sweepstakesSlug: '',
          teamSlug: '',
          prizeName: null,
          wonAt: WON_AT
        }
      ]);
    });

    it('falls back when the details name or visibility slug is null', async () => {
      prismaMock.$queryRaw.mockResolvedValue([aggregateRow('u-1', BigInt(1))]);
      prismaMock.user.findMany.mockResolvedValue([
        userWins('u-1', [
          [
            [
              draw('sw-1', {
                details: { name: null },
                visibility: { slug: null }
              })
            ]
          ]
        ])
      ]);

      const result = await getWinnersLeaderboard(undefined);

      const [win] = expectOk(result)[0].wins;
      expect(win.sweepstakesName).toBe('Unnamed Giveaway');
      expect(win.sweepstakesSlug).toBe('');
    });

    it('returns no wins for a winner whose details were not loaded', async () => {
      prismaMock.$queryRaw.mockResolvedValue([aggregateRow('u-1', BigInt(4))]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)).toEqual([
        {
          userId: 'u-1',
          userName: 'Name u-1',
          userEmail: 'u-1@example.com',
          userImage: null,
          winCount: 4,
          wins: []
        }
      ]);
    });

    it('keeps the aggregate order rather than the order of the loaded users', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        aggregateRow('u-2', BigInt(5)),
        aggregateRow('u-1', BigInt(1))
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        userWins('u-1', [[[draw('sw-1')]]]),
        userWins('u-2', [[[draw('sw-2')]]])
      ]);

      const result = await getWinnersLeaderboard(undefined);

      expect(
        expectOk(result).map((winner) => [winner.userId, winner.winCount])
      ).toEqual([
        ['u-2', 5],
        ['u-1', 1]
      ]);
      expect(expectOk(result)[0].wins[0].sweepstakesId).toBe('sw-2');
    });

    it('serves signed in callers the same way', async () => {
      signIn();
      prismaMock.$queryRaw.mockResolvedValue([aggregateRow('u-1', BigInt(1))]);
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await getWinnersLeaderboard(undefined);

      expect(expectOk(result)).toHaveLength(1);
    });
  });

  describe('input validation', () => {
    it.each([
      ['page of zero', 'page', { page: 0 }],
      ['fractional page', 'page', { page: 1.5 }],
      ['limit of zero', 'limit', { limit: 0 }],
      ['fractional limit', 'limit', { limit: 2.5 }],
      ['limit above 100', 'limit', { limit: 101 }],
      ['non-string search', 'search', { search: 5 }]
    ])('rejects a %s', async (_label, field, input) => {
      const result = await getWinnersLeaderboard(input as unknown as Input);

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toMatch(/^Input validation failed: /);
      expect(failure.message).toContain(`"${field}"`);
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it('accepts the maximum limit of 100', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await callWithPartialInput({ limit: 100 });

      expect(expectOk(result)).toEqual([]);
      expect(rawCall().values).toEqual([100, 0]);
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR with the error message', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('syntax error'));

      const result = await getWinnersLeaderboard(undefined);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'syntax error'
      );
    });
  });
});
