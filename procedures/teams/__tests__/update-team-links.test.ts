import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import updateTeamLinks from '../update-team-links';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  callerMembershipWhere,
  callerTeam,
  inputIssuePaths,
  PRISMA_NOT_FOUND_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

type LinksInput = Parameters<typeof updateTeamLinks>[0];

const links: LinksInput['links'] = [
  { platform: 'x', url: 'https://x.com/acme' },
  { platform: 'website', url: 'https://acme.dev' }
];

describe('updateTeamLinks', () => {
  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateTeamLinks({ slug: 'acme', links });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an unsupported platform', async () => {
      const result = await updateTeamLinks({
        slug: 'acme',
        links: [{ platform: 'myspace', url: 'https://myspace.com/acme' }]
      } as unknown as LinksInput);

      expect(inputIssuePaths(result)).toEqual([['links', 0, 'platform']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a slug', async () => {
      const result = await updateTeamLinks({
        links
      } as unknown as LinksInput);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an invalid url with the schema message', async () => {
      const result = await updateTeamLinks({
        slug: 'acme',
        links: [{ platform: 'x', url: 'not a url' }]
      });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Must be a valid URL'
      );
    });

    it('rejects links that are not an array', async () => {
      const result = await updateTeamLinks({
        slug: 'acme',
        links: { platform: 'x', url: 'https://x.com/acme' }
      } as unknown as LinksInput);

      expect(inputIssuePaths(result)).toEqual([['links']]);
    });
  });

  describe('team lookup and permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the full caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));

      await updateTeamLinks({ slug: 'acme', links });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          members: { where: { userId: TEST_USER.id } }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await updateTeamLinks({ slug: 'acme', links });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.team.update).not.toHaveBeenCalled();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));

        const result = await updateTeamLinks({ slug: 'acme', links });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_SOCIAL_LINKS')
        );
        expect(prismaMock.team.update).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(null));

      const result = await updateTeamLinks({ slug: 'acme', links });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s updates the links',
    (role) => {
      beforeEach(() => {
        signIn();
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));
      });

      it('replaces the team links and reports success', async () => {
        const result = await updateTeamLinks({ slug: 'acme', links });

        expect(expectOk(result)).toEqual({ success: true });
        expect(prismaMock.team.update).toHaveBeenCalledWith({
          where: { id: 'team-1' },
          data: { links }
        });
      });

      it('clears the links with an empty list', async () => {
        await updateTeamLinks({ slug: 'acme', links: [] });

        expect(prismaMock.team.update).toHaveBeenCalledWith({
          where: { id: 'team-1' },
          data: { links: [] }
        });
      });
    }
  );

  describe('when the update fails', () => {
    it('maps a prisma P2025 error to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.team.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await updateTeamLinks({ slug: 'acme', links });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
