import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getOrCreateSweepstakesParticipant } from '../get-sweepstake-participant';
import { SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildSelectedUser } from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';

type Input = Parameters<typeof getOrCreateSweepstakesParticipant>[0];

const COMPLETED_AT = new Date('2026-03-01T10:00:00.000Z');

const participantRow = (
  overrides: Partial<{
    allocations: { prize: { id: string; name: string | null } } | null;
    taskCompletions: unknown[];
    formValues: unknown[];
  }> = {}
) => ({
  id: 'participant-1',
  userId: TEST_USER.id,
  sweepstakesId: 'sw-1',
  createdAt: COMPLETED_AT,
  updatedAt: COMPLETED_AT,
  user: buildSelectedUser({ id: TEST_USER.id }),
  taskCompletions: [],
  formValues: [],
  allocations: null,
  ...overrides
});

const expectedUser = {
  id: TEST_USER.id,
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.png',
  source: 'SIGNUP',
  birthday: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  countryCode: 'XX',
  userAgent: 'unknown',
  qualityScore: 0,
  emailVerified: false,
  providers: [],
  onboarded: true,
  accountType: 'PARTICIPANT',
  username: null,
  preferredContactMethod: null,
  isAnonymous: true
};

const NOW = new Date('2026-03-10T12:00:00.000Z');

type StoredSweepstakes = {
  id: string;
  teamId: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  visibility: { visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' } | null;
  timing: { startDate: Date | null; endDate: Date | null } | null;
};

const storedSweepstakes = (
  overrides: Partial<StoredSweepstakes> = {}
): StoredSweepstakes => ({
  id: 'sw-1',
  teamId: 'team-1',
  status: 'ACTIVE',
  visibility: { visibility: 'PUBLIC' },
  timing: {
    startDate: new Date('2026-03-01T00:00:00.000Z'),
    endDate: new Date('2026-03-20T00:00:00.000Z')
  },
  ...overrides
});

const signedInWithSweepstakes = (
  id = 'sw-1',
  overrides: Partial<StoredSweepstakes> = {}
) => {
  signIn();
  prismaMock.sweepstakes.findFirst.mockResolvedValue(
    storedSweepstakes({ id, ...overrides })
  );
};

const givenNewParticipant = () => {
  prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);
  prismaMock.user.findFirst.mockResolvedValue(
    buildSelectedUser({ id: TEST_USER.id })
  );
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    audience: { formFields: [] }
  });
  prismaMock.sweepstakesParticipant.create.mockResolvedValue(participantRow());
  prismaMock.task.findMany.mockResolvedValue([]);
};

describe('getOrCreateSweepstakesParticipant', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is anonymous', () => {
    it('returns undefined without touching the database', async () => {
      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes cannot be found', () => {
    it('returns undefined and does not look for a participant', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'missing'
      });

      expect(expectOk(result)).toBeUndefined();
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });
  });

  describe('when the caller already participates', () => {
    it('looks the sweepstakes up by id or slug selecting its id, timing and visibility', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'promo' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: 'promo' }, { visibility: { slug: 'promo' } }] },
        select: {
          id: true,
          timing: { select: { startDate: true, endDate: true } },
          teamId: true,
          status: true,
          visibility: { select: { visibility: true } }
        }
      });
    });

    it('finds the participant using the resolved sweepstakes id rather than the slug', async () => {
      signedInWithSweepstakes('sw-resolved');
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'promo' });

      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: {
              userId: TEST_USER.id,
              sweepstakesId: 'sw-resolved'
            }
          },
          include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
        }
      );
    });

    it('returns the existing participant without creating a new one', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow({
          formValues: [{ fieldId: 'field-1', value: 'hello' }]
        })
      );

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)).toEqual({
        id: 'participant-1',
        user: expectedUser,
        allocation: null,
        completions: [],
        formValues: { 'field-1': 'hello' }
      });
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });

    it('maps task completions and the prize allocation', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow({
          allocations: { prize: { id: 'prize-1', name: 'Gift card' } },
          taskCompletions: [
            {
              id: 'c-1',
              completedAt: COMPLETED_AT,
              proof: null,
              status: 'COMPLETED',
              task: {
                id: 'task-1',
                sweepstakesId: 'sw-1',
                index: 0,
                config: {
                  type: 'BONUS_TASK',
                  title: 'Bonus',
                  value: 3,
                  mandatory: false,
                  tasksRequired: 0
                },
                sweepstakes: { details: { name: 'Big Giveaway' } }
              }
            }
          ]
        })
      );

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      const participant = expectOk(result);
      expect(participant?.allocation).toEqual({
        prize: { id: 'prize-1', name: 'Gift card' }
      });
      expect(participant?.completions).toEqual([
        {
          id: 'c-1',
          completedAt: COMPLETED_AT,
          status: 'COMPLETED',
          proof: null,
          task: {
            id: 'task-1',
            type: 'BONUS_TASK',
            title: 'Bonus',
            value: 3,
            mandatory: false,
            tasksRequired: 0
          },
          sweepstake: { id: 'sw-1', name: 'Big Giveaway' }
        }
      ]);
    });

    it('caches only the shared giveaway read, and reads the participant from the database', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledTimes(1);
      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['sweepstakes-access-v1-sw-1'],
        expect.any(Object)
      );
      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalled();
    });
  });

  describe('when the caller does not participate yet', () => {
    it('creates a participant for the caller and returns it', async () => {
      signedInWithSweepstakes('sw-1');
      givenNewParticipant();

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)?.id).toBe('participant-1');
      expect(prismaMock.sweepstakesParticipant.create).toHaveBeenCalledWith({
        data: {
          userId: TEST_USER.id,
          sweepstakesId: 'sw-1',
          formValues: { createMany: { data: [] } }
        },
        include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
      });
    });

    it('returns NOT_FOUND when the caller user record is missing', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `User with ID ${TEST_USER.id} not found when creating sweepstakes participant`
      );
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes audience is missing', async () => {
      signedInWithSweepstakes('sw-1');
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(
        buildSelectedUser({ id: TEST_USER.id })
      );
      prismaMock.sweepstakes.findUnique.mockResolvedValue({ audience: null });

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found when creating participant'
      );
    });
  });

  describe('when the giveaway is not accepting entries', () => {
    it.each([
      ['a draft', { status: 'DRAFT' as const }],
      ['a completed giveaway', { status: 'COMPLETED' as const }],
      [
        'a giveaway that has not started',
        {
          timing: {
            startDate: new Date(NOW.getTime() + 1),
            endDate: new Date('2026-03-20T00:00:00.000Z')
          }
        }
      ],
      [
        'a giveaway that has ended',
        {
          timing: {
            startDate: new Date('2026-03-01T00:00:00.000Z'),
            endDate: new Date(NOW.getTime() - 1)
          }
        }
      ],
      ['a giveaway without timing', { timing: null }],
      [
        'a giveaway without an end date',
        {
          timing: {
            startDate: new Date('2026-03-01T00:00:00.000Z'),
            endDate: null
          }
        }
      ],
      [
        'a giveaway without a start date',
        {
          timing: {
            startDate: null,
            endDate: new Date('2026-03-20T00:00:00.000Z')
          }
        }
      ]
    ])('does not create a participant for %s', async (_label, overrides) => {
      signedInWithSweepstakes('sw-1', overrides);
      prismaMock.membership.findUnique.mockResolvedValue({ id: 'm-1' });
      givenNewParticipant();

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });

    it('returns the existing participant of an ended giveaway', async () => {
      signedInWithSweepstakes('sw-1', {
        timing: {
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: new Date(NOW.getTime() - 1)
        }
      });
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)?.id).toBe('participant-1');
    });

    it.each([
      ['starts', { startDate: NOW, endDate: new Date('2026-03-20T00:00:00Z') }],
      ['ends', { startDate: new Date('2026-03-01T00:00:00Z'), endDate: NOW }]
    ])(
      'creates a participant at the moment the giveaway %s',
      async (_label, timing) => {
        signedInWithSweepstakes('sw-1', { timing });
        givenNewParticipant();

        await getOrCreateSweepstakesParticipant({ sweepstakesId: 'sw-1' });

        expect(prismaMock.sweepstakesParticipant.create).toHaveBeenCalled();
      }
    );
  });

  describe('when the giveaway is visible only to its team', () => {
    it.each([
      [
        'a private giveaway',
        { visibility: { visibility: 'PRIVATE' as const } }
      ],
      ['a draft', { status: 'DRAFT' as const }]
    ])(
      'returns undefined and reads nothing for a caller outside the team of %s',
      async (_label, overrides) => {
        signedInWithSweepstakes('sw-1', overrides);
        prismaMock.membership.findUnique.mockResolvedValue(null);

        const result = await getOrCreateSweepstakesParticipant({
          sweepstakesId: 'sw-1'
        });

        expect(expectOk(result)).toBeUndefined();
        expect(prismaMock.membership.findUnique).toHaveBeenCalledWith({
          where: {
            userId_teamId: { userId: TEST_USER.id, teamId: 'team-1' }
          },
          select: { id: true }
        });
        expect(
          prismaMock.sweepstakesParticipant.findUnique
        ).not.toHaveBeenCalled();
      }
    );

    it('returns undefined for a private giveaway without a team', async () => {
      signedInWithSweepstakes('sw-1', {
        teamId: null,
        visibility: { visibility: 'PRIVATE' }
      });

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
    });

    it('creates a participant for a member of the team of a private giveaway', async () => {
      signedInWithSweepstakes('sw-1', {
        visibility: { visibility: 'PRIVATE' }
      });
      prismaMock.membership.findUnique.mockResolvedValue({ id: 'm-1' });
      givenNewParticipant();

      const result = await getOrCreateSweepstakesParticipant({
        sweepstakesId: 'sw-1'
      });

      expect(expectOk(result)?.id).toBe('participant-1');
    });

    it('creates a participant of a giveaway without a visibility row', async () => {
      signedInWithSweepstakes('sw-1', { visibility: null });
      givenNewParticipant();

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'sw-1' });

      expect(prismaMock.sweepstakesParticipant.create).toHaveBeenCalled();
    });

    it('creates a participant of an UNLISTED giveaway without checking membership', async () => {
      signedInWithSweepstakes('sw-1', {
        visibility: { visibility: 'UNLISTED' }
      });
      givenNewParticipant();

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'sw-1' });

      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesParticipant.create).toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      signIn();

      const result = await getOrCreateSweepstakesParticipant(
        {} as unknown as Input
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });
});
