import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import deleteSweepstakes from '../delete-sweepstakes';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import {
  buildMember,
  buildTeam,
  buildTeamSweepstakes,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from './fixtures-procedures-sweepstakes-a';

const withRole = (role: TeamRole) =>
  buildTeamSweepstakes({
    team: buildTeam({ members: [buildMember({ role })] })
  });

describe('deleteSweepstakes', () => {
  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a non-string id', async () => {
      signIn();

      const result = await deleteSweepstakes({
        id: 1
      } as unknown as Parameters<typeof deleteSweepstakes>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes is not accessible', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the sweepstakes through the caller team membership', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ team: null })
      );

      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is not listed as a member', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({ members: [buildMember({ userId: 'other' })] })
        })
      );

      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });

    it.each([
      TeamRole.ADMIN,
      TeamRole.MEMBER,
      TeamRole.GUEST,
      TeamRole.BLOCKED
    ])(
      'returns FORBIDDEN for a %s because only owners can delete',
      async (role) => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(withRole(role));

        const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: DELETE_SWEEPSTAKES'
        );
        expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the caller owns the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        withRole(TeamRole.OWNER)
      );
      prismaMock.sweepstakes.delete.mockResolvedValue({ id: SWEEPSTAKES_ID });
    });

    it('deletes the sweepstakes by id', async () => {
      await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID }
      });
    });

    it('returns the team slug', async () => {
      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
    });

    it('deletes using the id of the loaded record', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...withRole(TeamRole.OWNER),
        id: 'loaded-id'
      });

      await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledWith({
        where: { id: 'loaded-id' }
      });
    });
  });

  describe('when the team has no slug', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ team: buildTeam({ slug: '' }) })
      );
      prismaMock.sweepstakes.delete.mockResolvedValue({ id: SWEEPSTAKES_ID });
    });

    it('returns CONFLICT', async () => {
      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'Failed to delete sweepstakes'
      );
    });

    it('has already deleted the sweepstakes', async () => {
      await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the delete fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        withRole(TeamRole.OWNER)
      );
    });

    it('maps a P2025 error to NOT_FOUND', async () => {
      prismaMock.sweepstakes.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('maps an unexpected error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.sweepstakes.delete.mockRejectedValue(new Error('boom'));

      const result = await deleteSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'boom'
      );
    });
  });
});
