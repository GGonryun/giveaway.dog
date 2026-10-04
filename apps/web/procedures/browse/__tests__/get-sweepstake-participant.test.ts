import { describe, it, expect } from 'vitest';
import { getOrCreateSweepstakesParticipant } from '../get-sweepstake-participant';
import { SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY } from '@/lib/participant/db';
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

const signedInWithSweepstakes = (id = 'sw-1') => {
  signIn();
  prismaMock.sweepstakes.findFirst.mockResolvedValue({ id });
};

describe('getOrCreateSweepstakesParticipant', () => {
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
    it('looks the sweepstakes up by id or slug selecting only its id', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'promo' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: 'promo' }, { visibility: { slug: 'promo' } }] },
        select: { id: true }
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

    it('does not cache the call', async () => {
      signedInWithSweepstakes();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantRow()
      );

      await getOrCreateSweepstakesParticipant({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });
  });

  describe('when the caller does not participate yet', () => {
    it('creates a participant for the caller and returns it', async () => {
      signedInWithSweepstakes('sw-1');
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(
        buildSelectedUser({ id: TEST_USER.id })
      );
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        audience: { formFields: [] }
      });
      prismaMock.sweepstakesParticipant.create.mockResolvedValue(
        participantRow()
      );
      prismaMock.task.findMany.mockResolvedValue([]);

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
