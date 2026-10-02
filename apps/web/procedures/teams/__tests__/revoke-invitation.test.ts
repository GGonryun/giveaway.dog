import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import revokeInvitation from '../revoke-invitation';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  callerMembershipWhere,
  callerTeam,
  inputIssuePaths,
  PRISMA_NOT_FOUND_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const input = { slug: 'acme', invitationId: 'inv-1' };

const invitation = (teamId = 'team-1') => ({
  id: 'inv-1',
  teamId,
  email: 'invitee@example.com',
  role: TeamRole.MEMBER
});

describe('revokeInvitation', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await revokeInvitation(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without an invitation id', async () => {
      signIn();

      const result = await revokeInvitation({
        slug: 'acme'
      } as unknown as Parameters<typeof revokeInvitation>[0]);

      expect(inputIssuePaths(result)).toEqual([['invitationId']]);
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await revokeInvitation({
        invitationId: 'inv-1'
      } as unknown as Parameters<typeof revokeInvitation>[0]);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.teamInviteEmail.findUnique.mockResolvedValue(invitation());

      await revokeInvitation(input);

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          members: {
            where: { userId: TEST_USER.id },
            select: { role: true, userId: true }
          }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await revokeInvitation(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.teamInviteEmail.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));

        const result = await revokeInvitation(input);

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('INVITE_MEMBERS')
        );
        expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(null));

      const result = await revokeInvitation(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s revokes an invitation',
    (role) => {
      beforeEach(() => {
        signIn();
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));
      });

      it('deletes the invitation and reports success', async () => {
        prismaMock.teamInviteEmail.findUnique.mockResolvedValue(invitation());

        const result = await revokeInvitation(input);

        expect(expectOk(result)).toEqual({ success: true });
        expect(prismaMock.teamInviteEmail.findUnique).toHaveBeenCalledWith({
          where: { id: 'inv-1' }
        });
        expect(prismaMock.teamInviteEmail.delete).toHaveBeenCalledWith({
          where: { id: 'inv-1' }
        });
      });

      it('returns NOT_FOUND when the invitation does not exist', async () => {
        prismaMock.teamInviteEmail.findUnique.mockResolvedValue(null);

        const result = await revokeInvitation(input);

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Invitation not found'
        );
        expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
      });

      it('returns NOT_FOUND when the invitation belongs to another team', async () => {
        prismaMock.teamInviteEmail.findUnique.mockResolvedValue(
          invitation('team-2')
        );

        const result = await revokeInvitation(input);

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Invitation not found'
        );
        expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
      });
    }
  );

  describe('when the invitation disappears before deletion', () => {
    it('maps the prisma P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.teamInviteEmail.findUnique.mockResolvedValue(invitation());
      prismaMock.teamInviteEmail.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await revokeInvitation(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
