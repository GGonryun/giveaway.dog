import { describe, it, expect } from 'vitest';
import { getUserHostRelationship } from '../get-user-host-relationship';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof getUserHostRelationship>[0];

const signedInWithHost = (teamId: string | null = 'team-1') => {
  signIn();
  prismaMock.user.findUnique.mockResolvedValue({ id: TEST_USER.id });
  prismaMock.sweepstakes.findFirst.mockResolvedValue({ teamId });
};

describe('getUserHostRelationship', () => {
  describe('when the caller is anonymous', () => {
    it('returns undefined without touching the database', async () => {
      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('does not cache the call', async () => {
      await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    it('caches per user and sweepstakes with user and host tags', async () => {
      signedInWithHost();
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

      await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`user-host-relationship-${TEST_USER.id}-sw-1`],
        {
          tags: [
            `user-${TEST_USER.id}-host-relationship`,
            'sweepstakes-sw-1-host'
          ],
          revalidate: 3600
        }
      );
    });

    it('looks up the caller profile by id', async () => {
      signedInWithHost();
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

      await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id }
      });
    });

    it('returns undefined when the caller has no profile', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });

    it('looks the sweepstakes up by id or slug and selects its team', async () => {
      signedInWithHost();
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

      await getUserHostRelationship({ sweepstakesId: 'promo' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: 'promo' }, { visibility: { slug: 'promo' } }] },
        select: { teamId: true }
      });
    });

    it('returns undefined when the sweepstakes does not exist', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue({ id: TEST_USER.id });
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.sweepstakesParticipant.count).not.toHaveBeenCalled();
    });

    it('returns undefined when the sweepstakes has no team', async () => {
      signedInWithHost(null);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.sweepstakesParticipant.count).not.toHaveBeenCalled();
    });

    it('returns the loyalty as the number of the host sweepstakes the caller took part in', async () => {
      signedInWithHost('team-7');
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(4);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({ loyalty: 4 });
    });

    it('counts participations with completed or pending task completions for the host team', async () => {
      signedInWithHost('team-7');
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(4);

      await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER.id,
          sweepstakes: { teamId: 'team-7' },
          taskCompletions: {
            some: { status: { in: ['COMPLETED', 'PENDING'] } }
          }
        }
      });
    });

    it('returns a loyalty of zero for a first-time participant', async () => {
      signedInWithHost();
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({ loyalty: 0 });
    });

    it('fails output validation when the loyalty count is negative', async () => {
      signedInWithHost();
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(-1);

      const result = await getUserHostRelationship({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Output validation failed'
      );
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      signIn();

      const result = await getUserHostRelationship({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
