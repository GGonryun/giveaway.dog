import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus } from '@prisma/client';
import getSweepstakeParticipation from '../get-sweepstake-participation';
import { PUBLIC_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const START = new Date('2026-09-01T00:00:00.000Z');
const END = new Date('2026-12-01T00:00:00.000Z');

type RowOptions = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  banner?: string | null;
  prizes?: number;
  participantsByTask?: string[][];
};

const publicRow = ({
  id = 'sweep-1',
  name = 'Summer Giveaway',
  slug = 'summer',
  banner = 'https://example.com/banner.png',
  prizes = 2,
  participantsByTask = [
    ['p-1', 'p-2'],
    ['p-2', 'p-3']
  ]
}: RowOptions = {}) => ({
  id,
  status: SweepstakesStatus.ACTIVE,
  teamId: 'team-1',
  createdAt: START,
  updatedAt: START,
  visibility: slug === null ? null : { slug },
  details: { name, description: 'Win things', banner },
  timing: { startDate: START, endDate: END },
  team: { id: 'team-1', slug: 'acme', name: 'Acme' },
  prizes: Array.from({ length: prizes }, (_, index) => ({
    id: `prize-${index}`
  })),
  tasks: participantsByTask.map((participants, index) => ({
    id: `task-${index}`,
    completions: participants.map((participantId) => ({ participantId }))
  }))
});

describe('getSweepstakeParticipation', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getSweepstakeParticipation();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries active sweepstakes where the caller completed or progressed a task', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      await getSweepstakeParticipation();

      expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          tasks: {
            some: {
              OR: [
                {
                  completions: {
                    some: { participant: { userId: TEST_USER.id } }
                  }
                },
                {
                  progress: {
                    some: { participant: { userId: TEST_USER.id } }
                  }
                }
              ]
            }
          }
        },
        include: PUBLIC_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns an empty list when there is no participation', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      const result = await getSweepstakeParticipation();

      expect(expectOk(result)).toEqual([]);
    });

    it('maps each sweepstakes to its public form', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([publicRow()]);

      const result = await getSweepstakeParticipation();

      expect(expectOk(result)).toEqual([
        {
          id: 'sweep-1',
          slug: 'summer',
          name: 'Summer Giveaway',
          description: 'Win things',
          banner: 'https://example.com/banner.png',
          startDate: START,
          endDate: END,
          status: 'RUNNING',
          host: { id: 'team-1', slug: 'acme', name: 'Acme' },
          prizes: 2,
          participants: 3,
          featured: false
        }
      ]);
    });

    it('leaves out the slug and banner when they are missing', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        publicRow({ slug: null, banner: null })
      ]);

      const result = await getSweepstakeParticipation();

      const [item] = expectOk(result);
      expect(item.slug).toBeUndefined();
      expect(item.banner).toBeUndefined();
    });

    it('drops sweepstakes that cannot be converted to the public form', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        publicRow({ id: 'valid' }),
        publicRow({ id: 'nameless', name: null })
      ]);

      const result = await getSweepstakeParticipation();

      expect(expectOk(result).map((item) => item.id)).toEqual(['valid']);
      expect(consoleError).toHaveBeenCalledWith(
        'Public sweepstakes parse error:',
        expect.anything()
      );
    });

    it('counts zero participants and prizes when there are none', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        publicRow({ prizes: 0, participantsByTask: [] })
      ]);

      const result = await getSweepstakeParticipation();

      expect(expectOk(result)[0]).toMatchObject({
        prizes: 0,
        participants: 0
      });
    });

    it('maps a P2025 database error to NOT_FOUND', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await getSweepstakeParticipation();

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
