import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import updateMemberRole from '../update-member-role';
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

type UpdateInput = Parameters<typeof updateMemberRole>[0];

const input = (overrides: Partial<UpdateInput> = {}): UpdateInput => ({
  slug: 'acme',
  membershipId: 'm-target',
  role: TeamRole.ADMIN,
  ...overrides
});

const target = (role: TeamRole) => ({
  id: 'm-target',
  userId: 'user-2',
  teamId: 'team-1',
  role,
  user: { id: 'user-2', name: 'Target' }
});

const roleUpdates = () =>
  prismaMock.membership.update.mock.calls.map(([args]) => args);

describe('updateMemberRole', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateMemberRole(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an unknown role', async () => {
      signIn();

      const result = await updateMemberRole({
        ...input(),
        role: 'SUPERUSER'
      } as unknown as UpdateInput);

      expect(inputIssuePaths(result)).toEqual([['role']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a membership id', async () => {
      signIn();

      const result = await updateMemberRole({
        slug: 'acme',
        role: TeamRole.MEMBER
      } as unknown as UpdateInput);

      expect(inputIssuePaths(result)).toEqual([['membershipId']]);
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await updateMemberRole({
        membershipId: 'm-target',
        role: TeamRole.MEMBER
      } as unknown as UpdateInput);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the full caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.membership.findFirst.mockResolvedValue(
        target(TeamRole.MEMBER)
      );

      await updateMemberRole(input());

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

      const result = await updateMemberRole(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(callerTeam(role));

        const result = await updateMemberRole(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('MANAGE_ROLES')
        );
        expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
        expect(prismaMock.membership.update).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(null));

      const result = await updateMemberRole(input());

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe('when the owner changes a role', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
    });

    it('looks the target membership up within the team', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(
        target(TeamRole.MEMBER)
      );

      await updateMemberRole(input());

      expect(prismaMock.membership.findFirst).toHaveBeenCalledWith({
        where: { id: 'm-target', teamId: 'team-1' },
        include: { user: true }
      });
    });

    it('returns NOT_FOUND when the target membership is not on the team', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(null);

      const result = await updateMemberRole(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Member not found'
      );
      expect(prismaMock.membership.update).not.toHaveBeenCalled();
    });

    it.each([
      [TeamRole.MEMBER, TeamRole.ADMIN],
      [TeamRole.ADMIN, TeamRole.MEMBER],
      [TeamRole.GUEST, TeamRole.MEMBER],
      [TeamRole.MEMBER, TeamRole.BLOCKED],
      [TeamRole.BLOCKED, TeamRole.GUEST]
    ])('changes a %s to %s', async (from, to) => {
      prismaMock.membership.findFirst.mockResolvedValue(target(from));

      const result = await updateMemberRole(input({ role: to }));

      expect(expectOk(result)).toEqual({ success: true });
      expect(roleUpdates()).toEqual([
        { where: { id: 'm-target' }, data: { role: to } }
      ]);
    });

    it('applies a no-op update when the role is unchanged', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(
        target(TeamRole.MEMBER)
      );

      const result = await updateMemberRole(input({ role: TeamRole.MEMBER }));

      expectOk(result);
      expect(roleUpdates()).toEqual([
        { where: { id: 'm-target' }, data: { role: TeamRole.MEMBER } }
      ]);
    });

    it.each(rolesExcept(TeamRole.OWNER))(
      'refuses to change the owner to %s',
      async (role) => {
        prismaMock.membership.findFirst.mockResolvedValue(
          target(TeamRole.OWNER)
        );

        const result = await updateMemberRole(input({ role }));

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'Cannot change the owner role. Transfer ownership first.'
        );
        expect(prismaMock.membership.update).not.toHaveBeenCalled();
      }
    );

    it('re-saves the owner role when the target is already the owner', async () => {
      prismaMock.membership.findFirst.mockResolvedValue(target(TeamRole.OWNER));

      const result = await updateMemberRole(input({ role: TeamRole.OWNER }));

      expectOk(result);
      expect(roleUpdates()).toEqual([
        { where: { id: 'm-target' }, data: { role: TeamRole.OWNER } }
      ]);
      expect(prismaMock.membership.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the owner transfers ownership', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.membership.findFirst
        .mockResolvedValueOnce(target(TeamRole.ADMIN))
        .mockResolvedValueOnce({
          id: 'm-self',
          userId: TEST_USER.id,
          teamId: 'team-1',
          role: TeamRole.OWNER
        });
    });

    it('looks up the current owner of the team', async () => {
      await updateMemberRole(input({ role: TeamRole.OWNER }));

      expect(prismaMock.membership.findFirst).toHaveBeenNthCalledWith(2, {
        where: { teamId: 'team-1', role: TeamRole.OWNER }
      });
    });

    it('demotes the current owner to ADMIN before promoting the target', async () => {
      const result = await updateMemberRole(input({ role: TeamRole.OWNER }));

      expect(expectOk(result)).toEqual({ success: true });
      expect(roleUpdates()).toEqual([
        { where: { id: 'm-self' }, data: { role: TeamRole.ADMIN } },
        { where: { id: 'm-target' }, data: { role: TeamRole.OWNER } }
      ]);
    });

    it('does not wrap the two updates in a transaction', async () => {
      await updateMemberRole(input({ role: TeamRole.OWNER }));

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('leaves the previous owner demoted when promoting the target fails', async () => {
      prismaMock.membership.update
        .mockResolvedValueOnce({ id: 'm-self', role: TeamRole.ADMIN })
        .mockRejectedValueOnce(new Error('write failed'));

      const result = await updateMemberRole(input({ role: TeamRole.OWNER }));

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'write failed'
      );
      expect(prismaMock.membership.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'm-self' },
        data: { role: TeamRole.ADMIN }
      });
    });
  });

  describe('when ownership is transferred but no owner row exists', () => {
    it('only promotes the target', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.membership.findFirst
        .mockResolvedValueOnce(target(TeamRole.GUEST))
        .mockResolvedValueOnce(null);

      const result = await updateMemberRole(input({ role: TeamRole.OWNER }));

      expectOk(result);
      expect(roleUpdates()).toEqual([
        { where: { id: 'm-target' }, data: { role: TeamRole.OWNER } }
      ]);
    });
  });

  describe('when the database fails', () => {
    it('maps a missing target during the update to NOT_FOUND', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.OWNER));
      prismaMock.membership.findFirst.mockResolvedValue(
        target(TeamRole.MEMBER)
      );
      prismaMock.membership.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await updateMemberRole(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
