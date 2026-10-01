import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus } from '@prisma/client';
import getSweepstakesList from '../get-sweepstakes-list';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const NOW = new Date('2025-06-15T12:00:00.000Z');
const CREATED_AT = new Date('2025-06-01T08:00:00.000Z');

type Input = Parameters<typeof getSweepstakesList>[0];

type CompletionFixture = { participant: { user: { id: string } } };

type SweepstakesRow = {
  id: string;
  status: SweepstakesStatus;
  createdAt: Date;
  details: { name: string | null } | null;
  timing: { startDate: Date | null; endDate: Date | null } | null;
  tasks: { completions: CompletionFixture[] }[];
};

const completion = (userId: string): CompletionFixture => ({
  participant: { user: { id: userId } }
});

const row = (overrides: Partial<SweepstakesRow> = {}): SweepstakesRow => ({
  id: 'sweep-1',
  status: SweepstakesStatus.ACTIVE,
  createdAt: CREATED_AT,
  details: { name: 'Summer Giveaway' },
  timing: {
    startDate: new Date('2025-06-10T12:00:00.000Z'),
    endDate: new Date('2025-06-20T12:00:00.000Z')
  },
  tasks: [],
  ...overrides
});

const teamWhere = {
  slug: 'acme',
  members: { some: { userId: TEST_USER.id } }
};

const list = (input: Partial<Input> = {}) =>
  getSweepstakesList({ slug: 'acme', ...input } as Input);

const findManyArgs = () => prismaMock.sweepstakes.findMany.mock.calls[0][0];

describe('getSweepstakesList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    prismaMock.sweepstakes.findMany.mockResolvedValue([]);
    prismaMock.sweepstakes.count.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await list();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing team slug', async () => {
      const result = await getSweepstakesList({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown status filter', async () => {
      const result = await list({ status: 'ACTIVE' } as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects an unknown sort field', async () => {
      const result = await list({ sortField: 'status' } as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects a non numeric page', async () => {
      const result = await list({ page: '2' } as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('query construction', () => {
    beforeEach(() => {
      signIn();
    });

    it('scopes the query to the team and user with default paging', async () => {
      await list();

      expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          timing: undefined,
          team: teamWhere
        },
        take: 10,
        skip: 0,
        include: {
          details: true,
          timing: true,
          tasks: {
            include: {
              completions: {
                include: { participant: { include: { user: true } } }
              }
            }
          }
        },
        orderBy: undefined
      });
    });

    it('counts with the same where clause as the page query', async () => {
      await list({ search: 'dog', status: 'RUNNING' });

      expect(prismaMock.sweepstakes.count).toHaveBeenCalledWith({
        where: findManyArgs().where
      });
    });

    it('skips previous pages based on the page size', async () => {
      await list({ page: 3 });

      expect(findManyArgs()).toMatchObject({ take: 10, skip: 20 });
    });

    it('treats page zero as the first page', async () => {
      const result = await list({ page: 0 });

      expect(findManyArgs().skip).toBe(0);
      expect(expectOk(result).currentPage).toBe(1);
    });

    it('filters by a case insensitive name search', async () => {
      await list({ search: 'dog' });

      expect(findManyArgs().where).toEqual({
        details: { name: { contains: 'dog', mode: 'insensitive' } },
        status: undefined,
        timing: undefined,
        team: teamWhere
      });
    });

    it('ignores an empty search string', async () => {
      await list({ search: '' });

      expect(findManyArgs().where).not.toHaveProperty('details');
    });

    it('does not filter by status when ALL is requested', async () => {
      await list({ status: 'ALL' });

      expect(findManyArgs().where).toMatchObject({
        status: undefined,
        timing: undefined
      });
    });

    it('filters scheduled sweepstakes by a future start date', async () => {
      await list({ status: 'SCHEDULED' });

      expect(findManyArgs().where).toMatchObject({
        status: 'ACTIVE',
        timing: { startDate: { gt: NOW } }
      });
    });

    it('filters running sweepstakes by a window around now', async () => {
      await list({ status: 'RUNNING' });

      expect(findManyArgs().where).toMatchObject({
        status: 'ACTIVE',
        timing: { startDate: { lte: NOW }, endDate: { gte: NOW } }
      });
    });

    it('filters expired sweepstakes by a past end date', async () => {
      await list({ status: 'EXPIRED' });

      expect(findManyArgs().where).toMatchObject({
        status: 'ACTIVE',
        timing: { endDate: { lt: NOW } }
      });
    });

    it('filters drafts by status only', async () => {
      await list({ status: 'DRAFT' });

      expect(findManyArgs().where).toMatchObject({
        status: 'DRAFT',
        timing: undefined
      });
    });

    it('filters completed sweepstakes by status only', async () => {
      await list({ status: 'COMPLETED' });

      expect(findManyArgs().where).toMatchObject({
        status: 'COMPLETED',
        timing: undefined
      });
    });

    it('orders by the details name when sorting by name', async () => {
      await list({ sortField: 'name', sortDirection: 'asc' });

      expect(findManyArgs().orderBy).toEqual({ details: { name: 'asc' } });
    });

    it('orders by the requested column for other sort fields', async () => {
      await list({ sortField: 'createdAt', sortDirection: 'desc' });

      expect(findManyArgs().orderBy).toEqual({ createdAt: 'desc' });
    });

    it('passes an undefined direction through when only the field is set', async () => {
      await list({ sortField: 'createdAt' });

      expect(findManyArgs().orderBy).toEqual({ createdAt: undefined });
    });
  });

  describe('result mapping', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns pagination metadata from the total count', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(21);

      const result = await list({ page: 2 });

      expect(expectOk(result)).toEqual({
        sweepstakes: [],
        totalCount: 21,
        currentPage: 2,
        totalPages: 3
      });
    });

    it('reports zero pages when there are no sweepstakes', async () => {
      const result = await list();

      expect(expectOk(result).totalPages).toBe(0);
    });

    it('reports exactly one page for a full single page', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(10);

      const result = await list();

      expect(expectOk(result).totalPages).toBe(1);
    });

    it('maps a running sweepstakes with entries and unique participants', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({
          tasks: [
            { completions: [completion('u-1'), completion('u-2')] },
            { completions: [completion('u-1')] }
          ]
        })
      ]);
      prismaMock.sweepstakes.count.mockResolvedValue(1);

      const result = await list();

      expect(expectOk(result).sweepstakes).toEqual([
        {
          id: 'sweep-1',
          name: 'Summer Giveaway',
          status: 'RUNNING',
          entries: 3,
          participants: 2,
          timeLeft: 'Ends in 5 days',
          endsAt: '2025-06-20T12:00:00.000Z',
          createdAt: '2025-06-01T08:00:00.000Z'
        }
      ]);
    });

    it('reports zero entries and participants when there are no completions', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ tasks: [{ completions: [] }] })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({ entries: 0, participants: 0 });
    });

    it('describes a scheduled sweepstakes by the time until it starts', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({
          timing: {
            startDate: new Date('2025-06-18T12:00:00.000Z'),
            endDate: new Date('2025-06-25T12:00:00.000Z')
          }
        })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({
        status: 'SCHEDULED',
        timeLeft: 'Starts in 3 days'
      });
    });

    it('describes an expired sweepstakes by how long ago it finished', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({
          timing: {
            startDate: new Date('2025-06-01T12:00:00.000Z'),
            endDate: new Date('2025-06-12T12:00:00.000Z')
          }
        })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({
        status: 'EXPIRED',
        timeLeft: 'Finished 3 days ago'
      });
    });

    it('describes a draft as not started', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ status: SweepstakesStatus.DRAFT })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({ status: 'DRAFT', timeLeft: 'Not started' });
    });

    it('describes a completed sweepstakes by its timing', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({
          status: SweepstakesStatus.COMPLETED,
          timing: {
            startDate: new Date('2025-06-01T12:00:00.000Z'),
            endDate: new Date('2025-06-14T12:00:00.000Z')
          }
        })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({
        status: 'COMPLETED',
        timeLeft: 'Finished 1 day ago'
      });
    });

    it('treats an active sweepstakes without timing as a draft with no end date', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ timing: null })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({
        status: 'DRAFT',
        timeLeft: 'Not started',
        endsAt: undefined
      });
    });

    it('reports ERROR for an active sweepstakes whose timing has no dates', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ timing: { startDate: null, endDate: null } })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item).toMatchObject({
        status: 'ERROR',
        timeLeft: 'Not started',
        endsAt: undefined
      });
    });

    it('falls back to the default name when details are missing', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ details: null })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item.name).toBe('Untitled Sweepstakes');
    });

    it('falls back to the default name when the name is null', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ details: { name: null } })
      ]);

      const [item] = expectOk(await list()).sweepstakes;

      expect(item.name).toBe('Untitled Sweepstakes');
    });

    it('keeps the order returned by the database', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        row({ id: 'b' }),
        row({ id: 'a' })
      ]);

      const result = await list();

      expect(expectOk(result).sweepstakes.map((s) => s.id)).toEqual(['b', 'a']);
    });
  });
});
