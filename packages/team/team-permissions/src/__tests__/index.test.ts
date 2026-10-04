import { describe, it, expect } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import {
  TeamPermission,
  assertMembershipPermission,
  hasPermission,
  requireMembershipPermission,
  requirePermission
} from '../index';
import { ApplicationError } from '@giveaway/util-errors';

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

const ALL_PERMISSIONS = Object.values(TeamPermission);

const EXPECTED: Record<TeamRole, TeamPermission[]> = {
  OWNER: [
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.MANAGE_ROLES,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.DELETE_SWEEPSTAKES,
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS,
    TeamPermission.MANAGE_INVITE_LINK,
    TeamPermission.MANAGE_SOCIAL_LINKS
  ],
  ADMIN: [
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS,
    TeamPermission.MANAGE_INVITE_LINK,
    TeamPermission.MANAGE_SOCIAL_LINKS
  ],
  MEMBER: [
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS
  ],
  GUEST: [
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.VIEW_PICKERS
  ],
  BLOCKED: []
};

const matrix = Object.values(TeamRole).flatMap((role) =>
  ALL_PERMISSIONS.map(
    (permission) =>
      [role, permission, EXPECTED[role].includes(permission)] as const
  )
);

describe('permissions', () => {
  describe('TeamPermission', () => {
    it('defines thirteen string permissions whose values match their keys', () => {
      expect(ALL_PERMISSIONS).toHaveLength(13);
      for (const [key, value] of Object.entries(TeamPermission)) {
        expect(value).toBe(key);
      }
    });
  });

  describe('hasPermission', () => {
    it.each(matrix)('%s has %s: %s', (role, permission, expected) => {
      expect(hasPermission(role, permission)).toBe(expected);
    });

    it('reserves MANAGE_ROLES and DELETE_SWEEPSTAKES for owners', () => {
      const roles = Object.values(TeamRole).filter(
        (role) =>
          hasPermission(role, TeamPermission.MANAGE_ROLES) ||
          hasPermission(role, TeamPermission.DELETE_SWEEPSTAKES)
      );

      expect(roles).toEqual([TeamRole.OWNER]);
    });

    it('grants blocked members nothing', () => {
      expect(
        ALL_PERMISSIONS.some((permission) =>
          hasPermission(TeamRole.BLOCKED, permission)
        )
      ).toBe(false);
    });

    it('throws a TypeError for an unknown role', () => {
      expect(() =>
        hasPermission(
          'SUPERUSER' as unknown as TeamRole,
          TeamPermission.VIEW_MEMBERS
        )
      ).toThrow(TypeError);
    });
  });

  describe('requirePermission', () => {
    it('returns undefined when the role has the permission', () => {
      expect(
        requirePermission(TeamRole.ADMIN, TeamPermission.INVITE_MEMBERS)
      ).toBeUndefined();
    });

    it('throws a FORBIDDEN application error naming the missing permission', () => {
      const error = catchError(() =>
        requirePermission(TeamRole.MEMBER, TeamPermission.REMOVE_MEMBERS)
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: REMOVE_MEMBERS'
      });
    });
  });

  describe('requireMembershipPermission', () => {
    it('returns true when the membership role has the permission', () => {
      expect(
        requireMembershipPermission(
          { role: TeamRole.GUEST, userId: 'user-1' },
          TeamPermission.VIEW_PICKERS
        )
      ).toBe(true);
    });

    it.each([null, undefined])(
      'throws FORBIDDEN for a %s membership',
      (membership) => {
        const error = catchError(() =>
          requireMembershipPermission(
            membership,
            TeamPermission.VIEW_SWEEPSTAKES
          )
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'FORBIDDEN',
          message: 'You are not a member of this team'
        });
      }
    );

    it('throws FORBIDDEN naming the permission when the role lacks it', () => {
      const error = catchError(() =>
        requireMembershipPermission(
          { role: TeamRole.BLOCKED, userId: 'user-1' },
          TeamPermission.VIEW_SWEEPSTAKES
        )
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: VIEW_SWEEPSTAKES'
      });
    });
  });

  describe('assertMembershipPermission', () => {
    it('returns undefined when the membership role has the permission', () => {
      expect(
        assertMembershipPermission(
          { role: TeamRole.OWNER, userId: 'user-1' },
          TeamPermission.MANAGE_ROLES
        )
      ).toBeUndefined();
    });

    it.each([null, undefined])(
      'throws FORBIDDEN for a %s membership',
      (membership) => {
        const error = catchError(() =>
          assertMembershipPermission(
            membership,
            TeamPermission.VIEW_SWEEPSTAKES
          )
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'FORBIDDEN',
          message: 'You are not a member of this team'
        });
      }
    );

    it('throws FORBIDDEN naming the permission when the role lacks it', () => {
      const error = catchError(() =>
        assertMembershipPermission(
          { role: TeamRole.ADMIN, userId: 'user-1' },
          TeamPermission.DELETE_SWEEPSTAKES
        )
      );

      expect(error).toMatchObject({
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: DELETE_SWEEPSTAKES'
      });
    });
  });
});
