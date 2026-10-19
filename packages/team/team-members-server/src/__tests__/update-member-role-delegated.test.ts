import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
import updateMemberRole from '../update-member-role';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { callerTeam } from '@giveaway/team-testing/testing/fixtures-procedures-teams';

vi.mock('@giveaway/team-permissions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@giveaway/team-permissions')>()),
  requireMembershipPermission: () => true
}));

const target = (role: TeamRole) => ({
  id: 'm-target',
  userId: 'user-2',
  teamId: 'team-1',
  role,
  user: { id: 'user-2', name: 'Target' }
});

describe('updateMemberRole when a non-owner holds MANAGE_ROLES', () => {
  beforeEach(() => {
    signIn();
    prismaMock.team.findFirst.mockResolvedValue(callerTeam(TeamRole.ADMIN));
  });

  it('refuses to transfer ownership', async () => {
    prismaMock.membership.findFirst.mockResolvedValue(target(TeamRole.MEMBER));

    const result = await updateMemberRole({
      slug: 'acme',
      membershipId: 'm-target',
      role: TeamRole.OWNER
    });

    expect(expectFailure(result, 'FORBIDDEN').message).toBe(
      'Only the current owner can transfer ownership'
    );
    expect(prismaMock.membership.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it('changes a role other than owner', async () => {
    prismaMock.membership.findFirst.mockResolvedValue(target(TeamRole.MEMBER));

    const result = await updateMemberRole({
      slug: 'acme',
      membershipId: 'm-target',
      role: TeamRole.GUEST
    });

    expect(expectOk(result)).toEqual({ success: true });
    expect(
      prismaMock.membership.update.mock.calls.map(([args]) => args)
    ).toEqual([{ where: { id: 'm-target' }, data: { role: TeamRole.GUEST } }]);
  });
});
