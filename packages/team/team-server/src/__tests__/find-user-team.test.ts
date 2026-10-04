import { describe, it, expect } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { findUserTeam, findUserTeamQuery } from '../find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { TEST_USER } from '@giveaway/testing-server/session';
import {
  NOT_A_MEMBER_MESSAGE,
  SLUG,
  TEAM_ID,
  permissionDeniedMessage
} from '@giveaway/team-testing/testing/fixtures-procedures-teams';

const db = asPrismaClient();

const buildMembership = ({
  userId = TEST_USER.id,
  role = TeamRole.OWNER
}: { userId?: string; role?: TeamRole } = {}) => ({
  id: `membership-${userId}`,
  userId,
  teamId: TEAM_ID,
  role
});

const buildTeam = (
  overrides: Partial<{
    tier: TeamTier;
    members: ReturnType<typeof buildMembership>[];
  }> = {}
) => ({
  id: TEAM_ID,
  name: 'Acme',
  slug: SLUG,
  tier: TeamTier.FREE,
  members: [buildMembership()],
  ...overrides
});

describe('findUserTeamQuery', () => {
  it('builds a slug based query when a slug is provided', () => {
    expect(findUserTeamQuery({ slug: 'acme', userId: 'user-9' })).toEqual({
      slug: 'acme',
      members: { some: { userId: 'user-9' } }
    });
  });

  it('builds an id based query when an id is provided', () => {
    expect(findUserTeamQuery({ id: 'team-9', userId: 'user-9' })).toEqual({
      id: 'team-9',
      members: { some: { userId: 'user-9' } }
    });
  });
});

describe('findUserTeam', () => {
  it('looks a team up by slug with its members', async () => {
    prismaMock.team.findUnique.mockResolvedValue(buildTeam());

    await findUserTeam({
      db,
      user: TEST_USER,
      slug: SLUG,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
      where: {
        slug: SLUG,
        members: { some: { userId: TEST_USER.id } }
      },
      include: { members: true }
    });
  });

  it('looks a team up by id with its members', async () => {
    prismaMock.team.findUnique.mockResolvedValue(buildTeam());

    await findUserTeam({
      db,
      user: TEST_USER,
      id: TEAM_ID,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
      where: {
        id: TEAM_ID,
        members: { some: { userId: TEST_USER.id } }
      },
      include: { members: true }
    });
  });

  it('returns the team and the caller membership', async () => {
    const team = buildTeam();
    prismaMock.team.findUnique.mockResolvedValue(team);

    const result = await findUserTeam({
      db,
      user: TEST_USER,
      id: TEAM_ID,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    expect(result).toEqual({ team, membership: buildMembership() });
  });

  it('throws NOT_FOUND when the team does not exist', async () => {
    prismaMock.team.findUnique.mockResolvedValue(null);

    await expect(
      findUserTeam({
        db,
        user: TEST_USER,
        id: TEAM_ID,
        permission: TeamPermission.VIEW_SWEEPSTAKES,
        tier: TeamTier.FREE
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Team not found' });
  });

  it('throws FORBIDDEN when the caller is not a member', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      buildTeam({ members: [buildMembership({ userId: 'user-2' })] })
    );

    await expect(
      findUserTeam({
        db,
        user: TEST_USER,
        id: TEAM_ID,
        permission: TeamPermission.VIEW_SWEEPSTAKES,
        tier: TeamTier.FREE
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: NOT_A_MEMBER_MESSAGE
    });
  });

  it('throws FORBIDDEN when a blocked member requests view access', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      buildTeam({ members: [buildMembership({ role: TeamRole.BLOCKED })] })
    );

    await expect(
      findUserTeam({
        db,
        user: TEST_USER,
        id: TEAM_ID,
        permission: TeamPermission.VIEW_SWEEPSTAKES,
        tier: TeamTier.FREE
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: permissionDeniedMessage('VIEW_SWEEPSTAKES')
    });
  });

  it('throws FORBIDDEN when the team tier is too low', async () => {
    prismaMock.team.findUnique.mockResolvedValue(buildTeam());

    await expect(
      findUserTeam({
        db,
        user: TEST_USER,
        id: TEAM_ID,
        permission: TeamPermission.VIEW_SWEEPSTAKES,
        tier: TeamTier.ALPHA
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'This feature requires a team with at least the ALPHA tier.'
    });
  });
});
