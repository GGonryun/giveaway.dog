import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus } from '@prisma/client';
import withdrawParticipation from '../withdraw-participation';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { PRISMA_NOT_FOUND_MESSAGE } from '@giveaway/user-model/testing/fixtures-procedures-user';

type WithdrawInput = Parameters<typeof withdrawParticipation>[0];

const NOW = new Date('2026-10-01T12:00:00.000Z');
const PAST = new Date('2026-09-01T00:00:00.000Z');
const FUTURE = new Date('2026-11-01T00:00:00.000Z');

type Timing = { startDate: Date | null; endDate: Date | null } | null;

const participant = (status: SweepstakesStatus, timing: Timing) => ({
  id: 'participant-1',
  userId: TEST_USER.id,
  sweepstakesId: 'sweep-1',
  createdAt: PAST,
  updatedAt: PAST,
  sweepstakes: {
    id: 'sweep-1',
    status,
    teamId: 'team-1',
    createdAt: PAST,
    updatedAt: PAST,
    timing: timing && {
      id: 'timing-1',
      sweepstakesId: 'sweep-1',
      timeZone: 'UTC',
      ...timing
    }
  }
});

describe('withdrawParticipation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects a missing sweepstakes id', async () => {
      signIn();

      const result = await withdrawParticipation(
        {} as unknown as WithdrawInput
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the caller is not a participant', () => {
    it('returns NOT_FOUND', async () => {
      signIn();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Participation record not found'
      );
      expect(prismaMock.sweepstakesParticipant.delete).not.toHaveBeenCalled();
    });
  });

  it('looks up the caller participation with the sweepstakes timing', async () => {
    signIn();
    prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

    await withdrawParticipation({ sweepstakesId: 'sweep-1' });

    expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_sweepstakesId: {
          userId: TEST_USER.id,
          sweepstakesId: 'sweep-1'
        }
      },
      include: { sweepstakes: { include: { timing: true } } }
    });
  });

  describe('when the giveaway can no longer be withdrawn from', () => {
    beforeEach(() => {
      signIn();
    });

    it('refuses a completed giveaway', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participant(SweepstakesStatus.COMPLETED, {
          startDate: PAST,
          endDate: FUTURE
        })
      );

      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You can only withdraw from active or scheduled giveaways'
      );
      expect(prismaMock.sweepstakesParticipant.delete).not.toHaveBeenCalled();
    });

    it('refuses an active giveaway without an end date', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participant(SweepstakesStatus.ACTIVE, {
          startDate: PAST,
          endDate: null
        })
      );

      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You can only withdraw from active or scheduled giveaways'
      );
    });
  });

  describe('when the giveaway can be withdrawn from', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakesParticipant.delete.mockResolvedValue({
        id: 'participant-1'
      });
    });

    it.each([
      [
        'running',
        participant(SweepstakesStatus.ACTIVE, {
          startDate: PAST,
          endDate: FUTURE
        })
      ],
      [
        'scheduled',
        participant(SweepstakesStatus.ACTIVE, {
          startDate: FUTURE,
          endDate: FUTURE
        })
      ],
      [
        'expired',
        participant(SweepstakesStatus.ACTIVE, {
          startDate: PAST,
          endDate: PAST
        })
      ],
      ['draft', participant(SweepstakesStatus.DRAFT, null)],
      ['active without timing', participant(SweepstakesStatus.ACTIVE, null)]
    ])('deletes the participation for a %s giveaway', async (_label, row) => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(row);

      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.sweepstakesParticipant.delete).toHaveBeenCalledWith({
        where: { id: 'participant-1' }
      });
    });

    it('maps a P2025 delete error to NOT_FOUND', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participant(SweepstakesStatus.ACTIVE, {
          startDate: PAST,
          endDate: FUTURE
        })
      );
      prismaMock.sweepstakesParticipant.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await withdrawParticipation({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
