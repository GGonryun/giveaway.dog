import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import getTeamInvitations from '../get-team-invitations';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  callerMembershipWhere,
  callerTeam,
  expectOutputFailure,
  inputIssuePaths,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from '@giveaway/team-testing/testing/fixtures-procedures-teams';

const invite = (id: string, email: string, role: TeamRole, iso: string) => ({
  id,
  teamId: 'team-1',
  email,
  role,
  createdAt: new Date(iso),
  updatedAt: new Date('2031-01-01T00:00:00.000Z')
});

describe('getTeamInvitations', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getTeamInvitations({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await getTeamInvitations(
        {} as unknown as Parameters<typeof getTeamInvitations>[0]
      );

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries invitations newest first along with the caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, { inviteEmails: [] })
      );

      await getTeamInvitations({ slug: 'acme' });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          inviteEmails: { orderBy: { createdAt: 'desc' } },
          members: {
            where: { userId: TEST_USER.id },
            select: { role: true, userId: true }
          }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await getTeamInvitations({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
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
          callerTeam(role, { inviteEmails: [] })
        );

        const result = await getTeamInvitations({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('INVITE_MEMBERS')
        );
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(null, { inviteEmails: [] })
      );

      const result = await getTeamInvitations({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s lists invitations',
    (role) => {
      beforeEach(() => {
        signIn();
      });

      it('returns an empty list when there are no invitations', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, { inviteEmails: [] })
        );

        const result = await getTeamInvitations({ slug: 'acme' });

        expect(expectOk(result)).toEqual([]);
      });

      it('returns the invitations in database order with only public fields', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, {
            inviteEmails: [
              invite(
                'i-2',
                'b@example.com',
                TeamRole.ADMIN,
                '2030-02-01T00:00:00.000Z'
              ),
              invite(
                'i-1',
                'a@example.com',
                TeamRole.GUEST,
                '2030-01-01T00:00:00.000Z'
              )
            ]
          })
        );

        const result = await getTeamInvitations({ slug: 'acme' });

        expect(expectOk(result)).toEqual([
          {
            id: 'i-2',
            email: 'b@example.com',
            role: TeamRole.ADMIN,
            createdAt: new Date('2030-02-01T00:00:00.000Z')
          },
          {
            id: 'i-1',
            email: 'a@example.com',
            role: TeamRole.GUEST,
            createdAt: new Date('2030-01-01T00:00:00.000Z')
          }
        ]);
      });
    }
  );

  describe('output validation', () => {
    it('fails when an invitation has an unknown role', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, {
          inviteEmails: [
            {
              id: 'i-1',
              email: 'a@example.com',
              role: 'SUPERUSER',
              createdAt: new Date('2030-01-01T00:00:00.000Z')
            }
          ]
        })
      );

      const result = await getTeamInvitations({ slug: 'acme' });

      expectOutputFailure(result);
    });

    it('converts invitation timestamps serialized as ISO strings to dates', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, {
          inviteEmails: [
            {
              id: 'i-1',
              email: 'a@example.com',
              role: TeamRole.GUEST,
              createdAt: '2030-01-01T00:00:00.000Z'
            }
          ]
        })
      );

      const result = await getTeamInvitations({ slug: 'acme' });

      expect(expectOk(result)).toEqual([
        {
          id: 'i-1',
          email: 'a@example.com',
          role: TeamRole.GUEST,
          createdAt: new Date('2030-01-01T00:00:00.000Z')
        }
      ]);
    });

    it('fails when an invitation has no creation date', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, {
          inviteEmails: [
            { id: 'i-1', email: 'a@example.com', role: TeamRole.GUEST }
          ]
        })
      );

      const result = await getTeamInvitations({ slug: 'acme' });

      expectOutputFailure(result);
    });
  });
});
