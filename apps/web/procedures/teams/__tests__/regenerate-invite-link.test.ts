import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import regenerateInviteLink from '../regenerate-invite-link';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  callerMembershipWhere,
  callerTeam,
  inputIssuePaths,
  inputIssues,
  PRISMA_NOT_FOUND_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const oldLink = { id: 'link-old', teamId: 'team-1', expiresAt: null };
const newLink = { id: 'link-new', teamId: 'team-1', expiresAt: null };

describe('regenerateInviteLink', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a non-string slug', async () => {
      signIn();

      const result = await regenerateInviteLink({
        slug: null
      } as unknown as Parameters<typeof regenerateInviteLink>[0]);

      expect(inputIssues(result)).toEqual([
        expect.objectContaining({
          path: ['slug'],
          message: 'Expected string, received null'
        })
      ]);
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await regenerateInviteLink(
        {} as unknown as Parameters<typeof regenerateInviteLink>[0]
      );

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team of the caller including the invite link', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteLink: null })
      );
      prismaMock.teamInviteLink.create.mockResolvedValue(newLink);

      await regenerateInviteLink({ slug: 'acme' });

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

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s without touching the link',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: oldLink })
        );

        const result = await regenerateInviteLink({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_INVITE_LINK')
        );
        expect(prismaMock.teamInviteLink.delete).not.toHaveBeenCalled();
        expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(null, { inviteLink: oldLink })
      );

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s regenerates the link',
    (role) => {
      beforeEach(() => {
        signIn();
        prismaMock.teamInviteLink.create.mockResolvedValue(newLink);
      });

      it('deletes the existing link before creating a new one', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: oldLink })
        );

        await regenerateInviteLink({ slug: 'acme' });

        expect(prismaMock.teamInviteLink.delete).toHaveBeenCalledWith({
          where: { id: 'link-old' }
        });
        expect(prismaMock.teamInviteLink.create).toHaveBeenCalledWith({
          data: { teamId: 'team-1' }
        });
        expect(
          prismaMock.teamInviteLink.delete.mock.invocationCallOrder[0]
        ).toBeLessThan(
          prismaMock.teamInviteLink.create.mock.invocationCallOrder[0]
        );
      });

      it('returns the new link code and url', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: oldLink })
        );

        const result = await regenerateInviteLink({ slug: 'acme' });

        expect(expectOk(result)).toEqual({
          code: 'link-new',
          url: 'https://giveaway.test/invites/link-new',
          expiresAt: null
        });
      });

      it('creates a link without deleting when the team has none', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteLink: null })
        );

        const result = await regenerateInviteLink({ slug: 'acme' });

        expect(prismaMock.teamInviteLink.delete).not.toHaveBeenCalled();
        expect(expectOk(result).code).toBe('link-new');
      });
    }
  );

  describe('link details', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteLink: null })
      );
    });

    it('returns the expiration date of the new link', async () => {
      const expiresAt = new Date('2030-05-01T00:00:00.000Z');
      prismaMock.teamInviteLink.create.mockResolvedValue({
        ...newLink,
        expiresAt
      });

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectOk(result).expiresAt).toEqual(expiresAt);
    });

    it('falls back to localhost when no app url is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
      prismaMock.teamInviteLink.create.mockResolvedValue(newLink);

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectOk(result).url).toBe(
        'http://localhost:3000/invites/link-new'
      );
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteLink: oldLink })
      );
    });

    it('maps a missing link during deletion to NOT_FOUND and skips creation', async () => {
      prismaMock.teamInviteLink.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
      expect(prismaMock.teamInviteLink.create).not.toHaveBeenCalled();
    });

    it('leaves the team without a link when creation fails after deletion', async () => {
      prismaMock.teamInviteLink.create.mockRejectedValue(
        new Error('insert failed')
      );

      const result = await regenerateInviteLink({ slug: 'acme' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'insert failed'
      );
      expect(prismaMock.teamInviteLink.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });
});
