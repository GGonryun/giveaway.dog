import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import getUserTeams from '../get-user-teams';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { authMock, createSession, signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const teamRecord = (
  id: string,
  members: { id: string; role: TeamRole; userId: string }[],
  overrides: Record<string, unknown> = {}
) => ({
  id,
  name: `Team ${id}`,
  slug: id,
  logo: `https://example.com/${id}.png`,
  links: null,
  tier: TeamTier.FREE,
  members,
  ...overrides
});

const self = (role: TeamRole) => ({
  id: `m-${role}`,
  role,
  userId: TEST_USER.id
});

describe('getUserTeams', () => {
  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getUserTeams();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findMany).not.toHaveBeenCalled();
    });

    it('rejects an expired session', async () => {
      authMock.mockResolvedValue(createSession({}, '2000-01-01T00:00:00.000Z'));

      const result = await getUserTeams();

      expectFailure(result, 'UNAUTHORIZED');
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries every team the caller is a member of', async () => {
      prismaMock.team.findMany.mockResolvedValue([]);

      await getUserTeams();

      expect(prismaMock.team.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          links: true,
          tier: true,
          members: { select: { id: true, role: true, userId: true } }
        },
        where: { members: { some: { userId: { equals: TEST_USER.id } } } }
      });
    });

    it('returns an empty list when the caller has no teams', async () => {
      prismaMock.team.findMany.mockResolvedValue([]);

      const result = await getUserTeams();

      expect(expectOk(result)).toEqual([]);
    });

    it('maps each team to its details with the caller role and member count', async () => {
      prismaMock.team.findMany.mockResolvedValue([
        teamRecord('alpha', [
          self(TeamRole.OWNER),
          { id: 'm-x', role: TeamRole.MEMBER, userId: 'user-2' }
        ]),
        teamRecord('beta', [self(TeamRole.GUEST)], {
          tier: TeamTier.ELITE,
          links: [{ platform: 'website', url: 'https://beta.dev' }]
        })
      ]);

      const result = await getUserTeams();

      expect(expectOk(result)).toEqual([
        {
          id: 'alpha',
          name: 'Team alpha',
          slug: 'alpha',
          logo: 'https://example.com/alpha.png',
          links: null,
          tier: TeamTier.FREE,
          memberCount: 2,
          role: TeamRole.OWNER
        },
        {
          id: 'beta',
          name: 'Team beta',
          slug: 'beta',
          logo: 'https://example.com/beta.png',
          links: [{ platform: 'website', url: 'https://beta.dev' }],
          tier: TeamTier.ELITE,
          memberCount: 1,
          role: TeamRole.GUEST
        }
      ]);
    });

    it('filters out teams where the caller is blocked', async () => {
      prismaMock.team.findMany.mockResolvedValue([
        teamRecord('alpha', [self(TeamRole.BLOCKED)]),
        teamRecord('beta', [self(TeamRole.ADMIN)])
      ]);

      const result = await getUserTeams();

      expect(expectOk(result).map((team) => team.slug)).toEqual(['beta']);
    });

    it('filters out teams whose member list lacks the caller', async () => {
      prismaMock.team.findMany.mockResolvedValue([
        teamRecord('alpha', [
          { id: 'm-x', role: TeamRole.OWNER, userId: 'user-2' }
        ]),
        teamRecord('beta', [self(TeamRole.MEMBER)])
      ]);

      const result = await getUserTeams();

      expect(expectOk(result).map((team) => team.slug)).toEqual(['beta']);
    });

    it('ignores input passed by the caller', async () => {
      prismaMock.team.findMany.mockResolvedValue([]);

      const result = await getUserTeams({
        slug: 'ignored'
      } as unknown as Parameters<typeof getUserTeams>[0]);

      expect(expectOk(result)).toEqual([]);
    });

    it('fails output validation when a team logo is missing', async () => {
      prismaMock.team.findMany.mockResolvedValue([
        teamRecord('alpha', [self(TeamRole.OWNER)], { logo: null })
      ]);

      const result = await getUserTeams();

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Output validation failed'
      );
    });

    it('maps an unknown prisma error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.team.findMany.mockRejectedValue(knownRequestError('P1001'));

      const result = await getUserTeams();

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });
  });
});
