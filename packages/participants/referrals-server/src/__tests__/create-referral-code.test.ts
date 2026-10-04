import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import createReferralCode from '../create-referral-code';
import { REFERRAL_USER_INCLUDE } from '../shared';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';

const mocks = vi.hoisted(() => ({ nanoid: vi.fn() }));

vi.mock('nanoid', () => ({ nanoid: mocks.nanoid }));

const CREATED_AT = new Date('2025-12-01T00:00:00.000Z');

const input = { taskId: 'task-1', sweepstakesId: 'sweep-1' };

const referralRow = (code: string, referredNames: string[] = []) => ({
  id: 'ref-1',
  code,
  participantId: 'participant-1',
  taskId: 'task-1',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  referredUsers: referredNames.map((name, i) => ({
    id: `ru-${i}`,
    referralId: 'ref-1',
    userId: `u-${i}`,
    createdAt: CREATED_AT,
    user: { id: `u-${i}`, name, username: null, createdAt: CREATED_AT }
  }))
});

describe('createReferralCode', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');
    mocks.nanoid.mockReset();
    mocks.nanoid.mockReturnValue('fresh1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying or revalidating', async () => {
      const result = await createReferralCode(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a task id', async () => {
      const result = await createReferralCode({
        sweepstakesId: 'sweep-1'
      } as unknown as Parameters<typeof createReferralCode>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });

    it('looks up the caller participation in the sweepstakes', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await createReferralCode(input);

      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: {
              userId: TEST_USER.id,
              sweepstakesId: 'sweep-1'
            }
          }
        }
      );
    });

    it('returns NOT_FOUND when the caller has not entered the giveaway', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await createReferralCode(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'You must enter the giveaway before generating a referral code'
      );
      expect(prismaMock.referral.findUnique).not.toHaveBeenCalled();
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns the existing referral for the participant and task', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1'
      });
      prismaMock.referral.findUnique.mockResolvedValue(
        referralRow('abc123', ['Jane'])
      );

      const result = await createReferralCode(input);

      expect(expectOk(result)).toEqual({
        id: 'abc123',
        code: 'abc123',
        link: 'https://giveaway.dog/browse/sweep-1?ref=abc123',
        referrals: [
          { user: { id: 'u-0', name: 'Jane' }, createdAt: CREATED_AT }
        ]
      });
      expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
        where: {
          participantId_taskId: {
            participantId: 'participant-1',
            taskId: 'task-1'
          }
        },
        include: REFERRAL_USER_INCLUDE
      });
      expect(prismaMock.referral.create).not.toHaveBeenCalled();
    });

    it('creates a new referral when the participant has none', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1'
      });
      prismaMock.referral.findUnique.mockResolvedValue(null);
      prismaMock.referral.create.mockResolvedValue(referralRow('fresh1'));

      const result = await createReferralCode(input);

      expect(expectOk(result)).toEqual({
        id: 'fresh1',
        code: 'fresh1',
        link: 'https://giveaway.dog/browse/sweep-1?ref=fresh1',
        referrals: []
      });
      expect(prismaMock.referral.create).toHaveBeenCalledWith({
        data: {
          code: 'fresh1',
          participantId: 'participant-1',
          taskId: 'task-1'
        },
        include: REFERRAL_USER_INCLUDE
      });
    });

    it('revalidates the user and sweepstakes referral caches', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1'
      });
      prismaMock.referral.findUnique.mockResolvedValue(referralRow('abc123'));

      await createReferralCode(input);

      expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
        [`user-${TEST_USER.id}-referral`, 'max'],
        ['sweepstakes-sweep-1-referral', 'max']
      ]);
    });

    it('returns INTERNAL_SERVER_ERROR when no unique code can be generated', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
        id: 'participant-1'
      });
      prismaMock.referral.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: 'taken' });

      const result = await createReferralCode(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to generate unique referral code'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
