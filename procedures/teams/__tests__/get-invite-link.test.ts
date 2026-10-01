import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import getInviteLink from '../get-invite-link';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  callerMembershipWhere,
  callerTeam,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const existingLink = {
  id: 'link-1',
  teamId: 'team-1',
  expiresAt: null
};

describe('getInviteLink', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await getInviteLink(
        {} as unknown as Parameters<typeof getInviteLink>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team of the caller including the invite link', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteLink: existingLink })
      );

      await getInviteLink({ slug: 'acme' });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          slug: true,
          inviteLink: true,
          members: {
            where: { userId: TEST_USER.id },
            select: { role: true, userId: true }
          }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await getInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: existingLink })
        );

        const result = await getInviteLink({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_INVITE_LINK')
        );
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(null, { inviteLink: existingLink })
      );

      const result = await getInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });

    it('does not create a link for a caller without permission', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.MEMBER, { inviteLink: null })
      );

      await getInviteLink({ slug: 'acme' });

      expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s requests the link',
    (role) => {
      beforeEach(() => {
        signIn();
      });

      it('returns the existing link without creating a new one', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: existingLink })
        );

        const result = await getInviteLink({ slug: 'acme' });

        expect(expectOk(result)).toEqual({
          code: 'link-1',
          url: 'https://giveaway.test/invites/link-1',
          expiresAt: null
        });
        expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
      });

      it('creates a link when the team has none', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: null })
        );
        prismaMock.teamInviteLink.create.mockResolvedValue({
          id: 'link-new',
          teamId: 'team-1',
          expiresAt: null
        });

        const result = await getInviteLink({ slug: 'acme' });

        expect(prismaMock.teamInviteLink.create).toHaveBeenCalledWith({
          data: { teamId: 'team-1' }
        });
        expect(expectOk(result)).toEqual({
          code: 'link-new',
          url: 'https://giveaway.test/invites/link-new',
          expiresAt: null
        });
      });
    }
  );

  describe('link details', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns the expiration date of the link', async () => {
      const expiresAt = new Date('2030-05-01T00:00:00.000Z');
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, {
          inviteLink: { ...existingLink, expiresAt }
        })
      );

      const result = await getInviteLink({ slug: 'acme' });

      expect(expectOk(result).expiresAt).toEqual(expiresAt);
    });

    it('falls back to localhost when no app url is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteLink: existingLink })
      );

      const result = await getInviteLink({ slug: 'acme' });

      expect(expectOk(result).url).toBe('http://localhost:3000/invites/link-1');
    });

    it('fails output validation when the expiration is not a date', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, {
          inviteLink: { ...existingLink, expiresAt: 'not a date' }
        })
      );

      const result = await getInviteLink({ slug: 'acme' });

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });
});
