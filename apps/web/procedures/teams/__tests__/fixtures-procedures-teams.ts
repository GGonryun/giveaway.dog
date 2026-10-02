import { expect } from 'vitest';
import { TeamRole } from '@prisma/client';
import { TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure } from '@giveaway/testing-server/result';
import type { Result } from '@/lib/mrpc/types';

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

export const PRISMA_NOT_FOUND_MESSAGE =
  'Unable to process your request. The item may no longer exist. Give us a minute before you try again.';

export const PRISMA_INTERNAL_ERROR_MESSAGE =
  /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: .{6}$/;

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

export type InputIssue = {
  code: string;
  path: (string | number)[];
  message: string;
};

const INPUT_FAILURE_PREFIX = 'Input validation failed: ';

export const inputIssues = <T>(result: Result<T>): InputIssue[] => {
  const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
  expect(failure.message.startsWith(INPUT_FAILURE_PREFIX)).toBe(true);
  return JSON.parse(failure.message.slice(INPUT_FAILURE_PREFIX.length));
};

export const inputIssuePaths = <T>(result: Result<T>) =>
  inputIssues(result).map((issue) => issue.path);

export const expectOutputFailure = <T>(result: Result<T>) => {
  const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
  expect(failure.message.startsWith('Output validation failed: ')).toBe(true);
  return failure;
};
