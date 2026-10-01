import { describe, it, expect } from 'vitest';
import { allocatePrize } from '../allocate-prize';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { authMock, createSession, signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { nextCacheMock } from '@/test/next-cache';

const validInput = { participantId: 'participant-1', prizeId: 'prize-1' };

describe('allocatePrize', () => {
  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await allocatePrize(validInput);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakesAllocation.upsert).not.toHaveBeenCalled();
    });

    it('returns UNAUTHORIZED when the session has expired', async () => {
      authMock.mockResolvedValue(createSession({}, '2000-01-01T00:00:00.000Z'));

      const result = await allocatePrize(validInput);

      expectFailure(result, 'UNAUTHORIZED');
      expect(prismaMock.sweepstakesAllocation.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when prizeId is missing', async () => {
      signIn();

      const result = await allocatePrize({
        participantId: 'participant-1'
      } as unknown as Parameters<typeof allocatePrize>[0]);

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toMatch(/^Input validation failed: /);
      expect(failure.message).toContain('prizeId');
      expect(prismaMock.sweepstakesAllocation.upsert).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when participantId is not a string', async () => {
      signIn();

      const result = await allocatePrize({
        participantId: 42,
        prizeId: 'prize-1'
      } as unknown as Parameters<typeof allocatePrize>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakesAllocation.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is authenticated and the input is valid', () => {
    it('returns success true', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockResolvedValue({});

      const result = await allocatePrize(validInput);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('upserts the allocation scoped to the participant owned by the caller', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockResolvedValue({});

      await allocatePrize(validInput);

      expect(prismaMock.sweepstakesAllocation.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakesAllocation.upsert).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-1',
          participant: { userId: TEST_USER.id }
        },
        create: { participantId: 'participant-1', prizeId: 'prize-1' },
        update: { prizeId: 'prize-1' }
      });
    });

    it('uses the id of the signed in user in the ownership filter', async () => {
      signIn({ id: 'user-42' });
      prismaMock.sweepstakesAllocation.upsert.mockResolvedValue({});

      await allocatePrize(validInput);

      expect(prismaMock.sweepstakesAllocation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId: 'participant-1',
            participant: { userId: 'user-42' }
          }
        })
      );
    });

    it('does not revalidate any cache tags', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockResolvedValue({});

      await allocatePrize(validInput);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('maps a prisma P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await allocatePrize(validInput);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('maps other prisma known errors to INTERNAL_SERVER_ERROR', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await allocatePrize(validInput);

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });

    it('maps a generic error to INTERNAL_SERVER_ERROR with its message', async () => {
      signIn();
      prismaMock.sweepstakesAllocation.upsert.mockRejectedValue(
        new Error('connection lost')
      );

      const result = await allocatePrize(validInput);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'connection lost'
      );
    });
  });
});
