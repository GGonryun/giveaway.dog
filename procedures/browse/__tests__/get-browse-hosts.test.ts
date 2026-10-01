import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getBrowseHosts from '../get-browse-hosts';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';
import {
  FIXED_NOW,
  daysFromFixedNow
} from './fixtures-procedures-browse-marketing-pickers';

type TeamFixture = { id: string; name: string | null; slug: string | null };

const sweepstakesWithTeam = (id: string, team: TeamFixture | null) => ({
  id,
  status: 'ACTIVE',
  teamId: team?.id ?? null,
  team
});

describe('getBrowseHosts', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('query shape', () => {
    it('queries active public sweepstakes that are running, recently ended, or starting within a day', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      await getBrowseHosts();

      expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          visibility: { visibility: 'PUBLIC' },
          OR: [
            {
              timing: {
                startDate: { lte: FIXED_NOW },
                endDate: { gte: daysFromFixedNow(-1) }
              }
            },
            {
              timing: {
                startDate: { gt: FIXED_NOW, lte: daysFromFixedNow(1) }
              }
            }
          ]
        },
        include: { team: true }
      });
    });

    it('wraps the handler in unstable_cache with the browse-hosts key, tag and a 300 second revalidate', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      await getBrowseHosts();

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['browse-hosts'],
        { tags: ['browse-hosts'], revalidate: 300 }
      );
    });
  });

  describe('result mapping', () => {
    it('returns an empty list when there are no matching sweepstakes', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([]);
    });

    it('returns one entry per team with id, name and slug', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', {
          id: 'team-1',
          name: 'Acme',
          slug: 'acme'
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-1', name: 'Acme', slug: 'acme' }
      ]);
    });

    it('deduplicates teams that host several sweepstakes, keeping the first occurrence', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', {
          id: 'team-1',
          name: 'First Name',
          slug: 'first'
        }),
        sweepstakesWithTeam('sw-2', {
          id: 'team-1',
          name: 'Second Name',
          slug: 'second'
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-1', name: 'First Name', slug: 'first' }
      ]);
    });

    it('skips sweepstakes that have no team', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', null),
        sweepstakesWithTeam('sw-2', {
          id: 'team-2',
          name: 'Beta',
          slug: 'beta'
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-2', name: 'Beta', slug: 'beta' }
      ]);
    });

    it('falls back to "Unknown" when the team has no name', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', {
          id: 'team-1',
          name: null,
          slug: 'acme'
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-1', name: 'Unknown', slug: 'acme' }
      ]);
    });

    it('falls back to the team id when the team has no slug', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', {
          id: 'team-1',
          name: 'Acme',
          slug: null
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-1', name: 'Acme', slug: 'team-1' }
      ]);
    });

    it('sorts hosts alphabetically by name', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', { id: 't-z', name: 'Zeta', slug: 'zeta' }),
        sweepstakesWithTeam('sw-2', {
          id: 't-a',
          name: 'alpha',
          slug: 'alpha'
        }),
        sweepstakesWithTeam('sw-3', { id: 't-m', name: 'Mu', slug: 'mu' })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result).map((host) => host.name)).toEqual([
        'alpha',
        'Mu',
        'Zeta'
      ]);
    });
  });

  describe('authorization', () => {
    it('serves signed in callers the same way as anonymous callers', async () => {
      signIn();
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakesWithTeam('sw-1', {
          id: 'team-1',
          name: 'Acme',
          slug: 'acme'
        })
      ]);

      const result = await getBrowseHosts();

      expect(expectOk(result)).toEqual([
        { id: 'team-1', name: 'Acme', slug: 'acme' }
      ]);
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR for an unexpected prisma error', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await getBrowseHosts();

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });

    it('returns INTERNAL_SERVER_ERROR with the message of a generic error', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(new Error('db down'));

      const result = await getBrowseHosts();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
    });
  });
});
