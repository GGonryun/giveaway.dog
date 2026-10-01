import { TeamRole } from '@prisma/client';
import { TEST_USER } from '@/test/session';

export const SLUG = 'acme';
export const TEAM_ID = 'team-1';

export const ALL_ROLES = [
  TeamRole.OWNER,
  TeamRole.ADMIN,
  TeamRole.MEMBER,
  TeamRole.GUEST,
  TeamRole.BLOCKED
] as const;

export const rolesExcept = (...allowed: TeamRole[]) =>
  ALL_ROLES.filter((role) => !allowed.includes(role));

export const NOT_A_MEMBER_MESSAGE = 'You are not a member of this team';

export const permissionDeniedMessage = (permission: string) =>
  `You do not have permission to perform this action. Required permission: ${permission}`;

export const callerMembershipWhere = (slug: string = SLUG) => ({
  slug,
  members: { some: { userId: TEST_USER.id } }
});

export const callerMembership = (role: TeamRole) => ({
  id: 'm-self',
  role,
  userId: TEST_USER.id
});

export const callerTeam = (
  role: TeamRole | null,
  extra: Record<string, unknown> = {}
) => ({
  id: TEAM_ID,
  slug: SLUG,
  members: role ? [callerMembership(role)] : [],
  ...extra
});
