import { describe, it, expect } from 'vitest';
import { getSweepstakesPrivacy } from '../get-sweepstakes-privacy';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { authMock, createSession, signIn, TEST_USER } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';

type Input = Parameters<typeof getSweepstakesPrivacy>[0];

const sweepstakes = (
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | null,
  teamId: string | null = 'team-1'
) => ({
  teamId,
  visibility: visibility ? { visibility } : null
});

describe('getSweepstakesPrivacy', () => {
  describe('query shape', () => {
    it('looks the sweepstakes up by id or slug and selects only teamId and visibility', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes('PUBLIC'));

      await getSweepstakesPrivacy({ sweepstakesId: 'my-slug' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'my-slug' }, { visibility: { slug: 'my-slug' } }]
        },
        select: {
          teamId: true,
          visibility: { select: { visibility: true } }
        }
      });
    });
  });

  describe('cache configuration', () => {
    it('caches anonymous checks under an anonymous key with only the sweepstakes privacy tag', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes('PUBLIC'));

      await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['sweepstakes-privacy-sw-1-anonymous'],
        { tags: ['sweepstakes-sw-1-privacy'], revalidate: 3600 }
      );
    });

    it('caches signed in checks per user with an extra user privacy tag', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes('PUBLIC'));

      await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        [`sweepstakes-privacy-sw-1-user-${TEST_USER.id}`],
        {
          tags: ['sweepstakes-sw-1-privacy', `user-${TEST_USER.id}-privacy`],
          revalidate: 3600
        }
      );
    });
  });

  describe('when the sweepstakes is visible to everyone', () => {
    it('returns true for a PUBLIC sweepstakes without checking membership', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes('PUBLIC'));

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBe(true);
      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
    });

    it('returns true for an UNLISTED sweepstakes', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('UNLISTED')
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBe(true);
    });

    it('returns true for a PUBLIC sweepstakes even when it has no team', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PUBLIC', null)
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBe(true);
    });
  });

  describe('when the sweepstakes is PRIVATE', () => {
    it('returns INTERNAL_SERVER_ERROR when the sweepstakes has no team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE', null)
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Sweepstakes teamId is missing'
      );
      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND for an anonymous caller', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE')
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'User is not authorized to view this sweepstakes'
      );
      expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
    });

    it('checks for a membership of the caller in the owning team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE', 'team-9')
      );
      prismaMock.membership.findUnique.mockResolvedValue({ id: 'm-1' });

      await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(prismaMock.membership.findUnique).toHaveBeenCalledWith({
        where: {
          userId_teamId: { userId: TEST_USER.id, teamId: 'team-9' }
        },
        select: { id: true }
      });
    });

    it('returns true when the caller is a member of the team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE')
      );
      prismaMock.membership.findUnique.mockResolvedValue({ id: 'm-1' });

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toBe(true);
    });

    it('returns FORBIDDEN when the caller is not a member of the team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE')
      );
      prismaMock.membership.findUnique.mockResolvedValue(null);

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'User is not authorized to view this sweepstakes'
      );
    });

    it('treats an expired session as anonymous', async () => {
      authMock.mockResolvedValue(createSession({}, '2000-01-01T00:00:00.000Z'));
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakes('PRIVATE')
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'User is not authorized to view this sweepstakes'
      );
    });
  });

  describe('when visibility data is missing', () => {
    it('returns INTERNAL_SERVER_ERROR when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'missing' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Sweepstakes visibility is missing'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the sweepstakes has no visibility row', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes(null));

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Sweepstakes visibility is missing'
      );
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is not a string', async () => {
      const result = await getSweepstakesPrivacy({
        sweepstakesId: null
      } as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('maps a prisma P2025 error to NOT_FOUND', async () => {
      prismaMock.sweepstakes.findFirst.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await getSweepstakesPrivacy({ sweepstakesId: 'sw-1' });

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
