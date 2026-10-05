import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserReferral } from '../get-user-referral';
import { REFERRAL_USER_INCLUDE } from '../shared';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';

const CREATED_AT = new Date('2025-12-01T00:00:00.000Z');

const referralRow = (code: string, referredNames: string[] = []) => ({
  id: `ref-${code}`,
  code,
  participantId: 'participant-1',
  taskId: 'task-1',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  referredUsers: referredNames.map((name, i) => ({
    id: `ru-${i}`,
    referralId: `ref-${code}`,
    userId: `u-${i}`,
    createdAt: CREATED_AT,
    user: { id: `u-${i}`, name, username: null, createdAt: CREATED_AT }
  }))
});

describe('getUserReferral', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the caller is not signed in', () => {
    it('returns an ok result without data', async () => {
      const result = await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toBeUndefined();
    });

    it('neither caches nor queries', async () => {
      await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a sweepstakes id', async () => {
      const result = await getUserReferral(
        {} as unknown as Parameters<typeof getUserReferral>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('caches the lookup per user and sweepstakes for a day', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`user-referral-${TEST_USER.id}-sweep-1`],
        {
          tags: [
            `user-${TEST_USER.id}-referral`,
            'sweepstakes-sweep-1-referral'
          ],
          revalidate: 86400
        }
      );
    });

    it('loads the caller participation with referrals for the sweepstakes tasks', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: {
              userId: TEST_USER.id,
              sweepstakesId: 'sweep-1'
            }
          },
          include: {
            referrals: {
              where: { task: { sweepstakesId: 'sweep-1' } },
              include: REFERRAL_USER_INCLUDE
            }
          }
        }
      );
    });

    it('ignores an extra task id in the input', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await getUserReferral({
        sweepstakesId: 'sweep-1',
        taskId: 'task-1'
      } as unknown as Parameters<typeof getUserReferral>[0]);

      expect(expectOk(result)).toBeUndefined();
    });

    it('returns nothing when the caller has not entered the giveaway', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toBeUndefined();
    });

    it('returns nothing when the caller has no referral yet', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1',
        referrals: []
      });

      const result = await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toBeUndefined();
    });

    it('returns the referral with its link and referred users', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1',
        referrals: [referralRow('abc123', ['Jane', 'Bob'])]
      });

      const result = await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toEqual({
        id: 'abc123',
        code: 'abc123',
        link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
        referrals: [
          { user: { id: 'u-0', name: 'Jane' }, createdAt: CREATED_AT },
          { user: { id: 'u-1', name: 'Bob' }, createdAt: CREATED_AT }
        ]
      });
    });

    it('returns INTERNAL_SERVER_ERROR when several referrals exist', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1',
        referrals: [referralRow('abc123'), referralRow('def456')]
      });

      const result = await getUserReferral({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Multiple referrals found for the same task'
      );
    });
  });
});
