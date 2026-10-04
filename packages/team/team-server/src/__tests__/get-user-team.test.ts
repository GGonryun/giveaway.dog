import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import getUserTeam from '../get-user-team';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  callerMembershipWhere,
  expectOutputFailure,
  inputIssuePaths
} from '@giveaway/team-testing/testing/fixtures-procedures-teams';

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), {
      digest: `NEXT_REDIRECT;replace;${url};307;`
    });
  })
}));

vi.mock('next/navigation', () => ({ redirect: navigation.redirect }));

const teamRecord = (
  members: { id: string; role: TeamRole; userId: string }[],
  overrides: Record<string, unknown> = {}
) => ({
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png',
  links: [{ platform: 'x', url: 'https://x.com/acme' }],
  tier: TeamTier.PRO,
  members,
  ...overrides
});

describe('getUserTeam', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    navigation.redirect.mockClear();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getUserTeam({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await getUserTeam(
        {} as unknown as Parameters<typeof getUserTeam>[0]
      );

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller belongs to the team', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with the detailed selection', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord([{ id: 'm-1', role: TeamRole.OWNER, userId: TEST_USER.id }])
      );

      await getUserTeam({ slug: 'acme' });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          links: true,
          tier: true,
          members: { select: { id: true, role: true, userId: true } }
        }
      });
    });

    it('returns the team details with the caller role and member count', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord([
          { id: 'm-0', role: TeamRole.OWNER, userId: 'owner' },
          { id: 'm-1', role: TeamRole.GUEST, userId: TEST_USER.id },
          { id: 'm-2', role: TeamRole.BLOCKED, userId: 'user-3' }
        ])
      );

      const result = await getUserTeam({ slug: 'acme' });

      expect(expectOk(result)).toEqual({
        id: 'team-1',
        name: 'Acme',
        slug: 'acme',
        logo: 'https://example.com/logo.png',
        links: [{ platform: 'x', url: 'https://x.com/acme' }],
        tier: TeamTier.PRO,
        memberCount: 3,
        role: TeamRole.GUEST
      });
    });

    it('does not redirect', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord([{ id: 'm-1', role: TeamRole.MEMBER, userId: TEST_USER.id }])
      );

      await getUserTeam({ slug: 'acme' });

      expect(navigation.redirect).not.toHaveBeenCalled();
    });

    it('fails output validation when the team tier is unknown', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord(
          [{ id: 'm-1', role: TeamRole.OWNER, userId: TEST_USER.id }],
          { tier: 'PLATINUM' }
        )
      );

      const result = await getUserTeam({ slug: 'acme' });

      expectOutputFailure(result);
    });
  });

  describe('when the caller is not a member', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(null);
    });

    it('throws a redirect to /app instead of returning a result', async () => {
      await expect(getUserTeam({ slug: 'acme' })).rejects.toMatchObject({
        message: 'NEXT_REDIRECT',
        digest: 'NEXT_REDIRECT;replace;/app;307;'
      });
      expect(navigation.redirect).toHaveBeenCalledWith('/app');
    });

    it('logs that the user is not a member', async () => {
      await getUserTeam({ slug: 'acme' }).catch(() => undefined);

      expect(consoleError).toHaveBeenCalledWith(
        `User ${TEST_USER.id} is not a member of team acme`
      );
    });
  });

  describe('when the caller is blocked', () => {
    beforeEach(() => {
      signIn();
    });

    it('throws a redirect to /app', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord([
          { id: 'm-1', role: TeamRole.BLOCKED, userId: TEST_USER.id }
        ])
      );

      await expect(getUserTeam({ slug: 'acme' })).rejects.toMatchObject({
        digest: 'NEXT_REDIRECT;replace;/app;307;'
      });
      expect(navigation.redirect).toHaveBeenCalledWith('/app');
    });

    it('logs that the user is blocked using the team slug from the database', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord(
          [{ id: 'm-1', role: TeamRole.BLOCKED, userId: TEST_USER.id }],
          { slug: 'acme-db' }
        )
      );

      await getUserTeam({ slug: 'acme' }).catch(() => undefined);

      expect(consoleError).toHaveBeenCalledWith(
        `User ${TEST_USER.id} is blocked from team acme-db`
      );
    });

    it('treats a caller missing from the member list as blocked', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamRecord([{ id: 'm-0', role: TeamRole.OWNER, userId: 'owner' }])
      );

      await expect(getUserTeam({ slug: 'acme' })).rejects.toMatchObject({
        digest: 'NEXT_REDIRECT;replace;/app;307;'
      });
    });
  });
});
