import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamRole, VisibilityType } from '@giveaway/db-model';
import toggleVisibility from '../toggle-visibility';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  SWEEPSTAKES_ID,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-b';

type Input = Parameters<typeof toggleVisibility>[0];

const input = (visibility: VisibilityType): Input => ({
  sweepstakesId: SWEEPSTAKES_ID,
  visibility
});

describe('toggleVisibility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    prismaMock.sweepstakesVisibility.findUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('access control', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown visibility value', async () => {
      signIn();

      const result = await toggleVisibility({
        sweepstakesId: SWEEPSTAKES_ID,
        visibility: 'HIDDEN'
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"visibility"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects input without a sweepstakes id', async () => {
      signIn();

      const result = await toggleVisibility({
        visibility: VisibilityType.PUBLIC
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"sweepstakesId"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes from the input sweepstakes id scoped to the caller', async () => {
      signIn();

      await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes is not accessible', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest member', async () => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      );
      expect(prismaMock.sweepstakesVisibility.update).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesVisibility.create).not.toHaveBeenCalled();
    });
  });

  describe('making a sweepstakes public', () => {
    beforeEach(() => {
      signIn();
    });

    it('refuses when the sweepstakes has no team id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ teamId: null })
      );

      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Sweepstakes must belong to a team to be made public. Please contact support at /support for assistance.'
      );
      expect(
        prismaMock.sweepstakesVisibility.findUnique
      ).not.toHaveBeenCalled();
    });

    it('allows a private visibility when the sweepstakes has no team id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ teamId: null })
      );

      const result = await toggleVisibility(input(VisibilityType.PRIVATE));

      expect(expectOk(result)).toEqual({ visibility: VisibilityType.PRIVATE });
    });
  });

  describe('persisting the visibility', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the existing visibility row by sweepstakes id', async () => {
      await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(prismaMock.sweepstakesVisibility.findUnique).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID }
      });
    });

    it('updates the existing visibility row', async () => {
      prismaMock.sweepstakesVisibility.findUnique.mockResolvedValue({
        id: 'vis-1',
        sweepstakesId: SWEEPSTAKES_ID,
        visibility: VisibilityType.UNLISTED
      });

      await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(prismaMock.sweepstakesVisibility.update).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID },
        data: { visibility: VisibilityType.PUBLIC }
      });
      expect(prismaMock.sweepstakesVisibility.create).not.toHaveBeenCalled();
    });

    it('creates a visibility row when none exists', async () => {
      await toggleVisibility(input(VisibilityType.UNLISTED));

      expect(prismaMock.sweepstakesVisibility.create).toHaveBeenCalledWith({
        data: {
          sweepstakesId: SWEEPSTAKES_ID,
          visibility: VisibilityType.UNLISTED
        }
      });
      expect(prismaMock.sweepstakesVisibility.update).not.toHaveBeenCalled();
    });

    it('returns the requested visibility', async () => {
      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectOk(result)).toEqual({ visibility: VisibilityType.PUBLIC });
    });

    it('invalidates the sweepstakes and privacy cache tags', async () => {
      await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
        [`sweepstakes-${SWEEPSTAKES_ID}`, 'max'],
        [`sweepstakes-${SWEEPSTAKES_ID}-privacy`, 'max']
      ]);
    });

    it('returns INTERNAL_SERVER_ERROR when the write fails', async () => {
      prismaMock.sweepstakesVisibility.create.mockRejectedValue(
        new Error('write failed')
      );

      const result = await toggleVisibility(input(VisibilityType.PUBLIC));

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'write failed'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
