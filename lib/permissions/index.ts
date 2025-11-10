import { TeamRole } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';

export enum TeamPermission {
  INVITE_MEMBERS = 'INVITE_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_MEMBERS = 'VIEW_MEMBERS',
  MANAGE_INVITE_LINK = 'MANAGE_INVITE_LINK'
}

const ROLE_PERMISSIONS: Record<TeamRole, TeamPermission[]> = {
  [TeamRole.OWNER]: [
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.MANAGE_ROLES,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.MANAGE_INVITE_LINK
  ],
  [TeamRole.ADMIN]: [
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.MANAGE_INVITE_LINK
  ],
  [TeamRole.MEMBER]: [TeamPermission.VIEW_MEMBERS],
  [TeamRole.GUEST]: [],
  [TeamRole.BLOCKED]: []
};

export const hasPermission = (
  role: TeamRole,
  permission: TeamPermission
): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
};

export const requirePermission = (
  role: TeamRole,
  permission: TeamPermission
): void => {
  if (!hasPermission(role, permission)) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: `You do not have permission to perform this action. Required permission: ${permission}`
    });
  }
};

export interface MembershipWithRole {
  role: TeamRole;
  userId: string;
}

export const requireMembershipPermission = (
  membership: MembershipWithRole | null | undefined,
  permission: TeamPermission
): void => {
  if (!membership) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this team'
    });
  }

  requirePermission(membership.role, permission);
};
