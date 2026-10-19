import { TeamRole } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

export enum TeamPermission {
  INVITE_MEMBERS = 'INVITE_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_MEMBERS = 'VIEW_MEMBERS',
  VIEW_SWEEPSTAKES = 'VIEW_SWEEPSTAKES',
  UPDATE_SWEEPSTAKES = 'UPDATE_SWEEPSTAKES',
  DELETE_SWEEPSTAKES = 'DELETE_SWEEPSTAKES',
  UPDATE_INTEGRATIONS = 'UPDATE_INTEGRATIONS',
  VIEW_INTEGRATIONS = 'VIEW_INTEGRATIONS',
  UPDATE_PICKERS = 'UPDATE_PICKERS',
  VIEW_PICKERS = 'VIEW_PICKERS',
  MANAGE_INVITE_LINK = 'MANAGE_INVITE_LINK',
  MANAGE_SOCIAL_LINKS = 'MANAGE_SOCIAL_LINKS'
}

const ROLE_PERMISSIONS: Record<TeamRole, ReadonlySet<TeamPermission>> = {
  [TeamRole.OWNER]: new Set([
    TeamPermission.MANAGE_ROLES,
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.MANAGE_INVITE_LINK,
    TeamPermission.MANAGE_SOCIAL_LINKS,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.DELETE_SWEEPSTAKES,
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS
  ]),
  [TeamRole.ADMIN]: new Set([
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.VIEW_MEMBERS,
    TeamPermission.MANAGE_INVITE_LINK,
    TeamPermission.MANAGE_SOCIAL_LINKS,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS
  ]),
  [TeamRole.MEMBER]: new Set([
    TeamPermission.UPDATE_INTEGRATIONS,
    TeamPermission.UPDATE_SWEEPSTAKES,
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.UPDATE_PICKERS,
    TeamPermission.VIEW_PICKERS
  ]),
  [TeamRole.GUEST]: new Set([
    TeamPermission.VIEW_SWEEPSTAKES,
    TeamPermission.VIEW_INTEGRATIONS,
    TeamPermission.VIEW_PICKERS
  ]),
  [TeamRole.BLOCKED]: new Set()
};

export const hasPermission = (
  role: TeamRole,
  permission: TeamPermission
): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.has(permission);
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
): membership is MembershipWithRole => {
  if (!membership) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this team'
    });
  }

  requirePermission(membership.role, permission);
  return true;
};

export function assertMembershipPermission(
  membership: MembershipWithRole | null | undefined,
  permission: TeamPermission
): asserts membership is MembershipWithRole {
  if (!membership) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this team'
    });
  }

  requirePermission(membership.role, permission);
}
