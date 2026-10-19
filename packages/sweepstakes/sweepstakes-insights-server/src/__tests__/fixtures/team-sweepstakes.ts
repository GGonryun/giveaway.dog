import { describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure } from '@giveaway/testing-server/result';
import { SWEEPSTAKES_ID } from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

type ResultLike =
  | { ok: true; data: unknown }
  | { ok: false; data: { code: string; message: string } };

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | 'BLOCKED';

export const teamSweepstakes = (
  role: Role = 'OWNER',
  id: string = SWEEPSTAKES_ID
) => ({
  id,
  team: { members: [{ userId: TEST_USER.id, role }] }
});

export const teamSweepstakesQuery = (
  slug: string,
  sweepstakesId: string = SWEEPSTAKES_ID
) => ({
  where: {
    id: sweepstakesId,
    team: { slug, members: { some: { userId: TEST_USER.id } } }
  },
  select: {
    id: true,
    team: {
      select: {
        members: {
          where: { userId: TEST_USER.id },
          select: { userId: true, role: true }
        }
      }
    }
  }
});

export const describeTeamAccess = (
  call: () => Promise<ResultLike>,
  reads: () => Mock[]
) => {
  describe('access', () => {
    it('returns UNAUTHORIZED to a signed-out caller without reading the database', async () => {
      const result = await call();

      expectFailure(result, 'UNAUTHORIZED');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      for (const read of reads()) expect(read).not.toHaveBeenCalled();
    });

    describe('when signed in', () => {
      beforeEach(() => {
        signIn();
      });

      it('returns NOT_FOUND to a caller who is not a member of the team', async () => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

        const result = await call();

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
        );
        for (const read of reads()) expect(read).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN to a blocked member', async () => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          teamSweepstakes('BLOCKED') as never
        );

        const result = await call();

        expectFailure(result, 'FORBIDDEN');
        for (const read of reads()) expect(read).not.toHaveBeenCalled();
      });
    });
  });
};
