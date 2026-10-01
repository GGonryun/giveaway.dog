import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import selectTeam from '../select-team';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { authMock, createSession, signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const teamRecord = (id: string, role: TeamRole) => ({
  id,
  name: `Team ${id}`,
  slug: `slug-${id}`,
  logo: `https://example.com/${id}.png`,
  links: null,
  tier: TeamTier.FREE,
  members: [{ id: `m-${id}`, role, userId: TEST_USER.id }]
});

describe('selectTeam', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers without loading teams', async () => {
      const result = await selectTeam({ id: 'alpha' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findMany).not.toHaveBeenCalled();
    });

    it('rejects input without an id', async () => {
      signIn();

      const result = await selectTeam(
        {} as unknown as Parameters<typeof selectTeam>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller teams load', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findMany.mockResolvedValue([
        teamRecord('alpha', TeamRole.OWNER),
        teamRecord('beta', TeamRole.GUEST),
        teamRecord('gamma', TeamRole.BLOCKED)
      ]);
    });

    it('returns the full details of the matching team', async () => {
      const result = await selectTeam({ id: 'beta' });

      expect(expectOk(result)).toEqual({
        id: 'beta',
        name: 'Team beta',
        slug: 'slug-beta',
        logo: 'https://example.com/beta.png',
        links: null,
        tier: TeamTier.FREE,
        memberCount: 1,
        role: TeamRole.GUEST
      });
    });

    it('loads teams for the signed-in user', async () => {
      await selectTeam({ id: 'alpha' });

      expect(prismaMock.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { members: { some: { userId: { equals: TEST_USER.id } } } }
        })
      );
    });

    it('returns NOT_FOUND when no team has the id', async () => {
      const result = await selectTeam({ id: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
    });

    it('returns NOT_FOUND for a team where the caller is blocked', async () => {
      const result = await selectTeam({ id: 'gamma' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
    });

    it('matches on id rather than slug', async () => {
      const result = await selectTeam({ id: 'slug-alpha' });

      expectFailure(result, 'NOT_FOUND');
    });
  });

  describe('when loading the caller teams fails', () => {
    it('forwards an unexpected error with a fixed cause', async () => {
      signIn();
      prismaMock.team.findMany.mockRejectedValue(new Error('db offline'));

      const result = await selectTeam({ id: 'alpha' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR')).toEqual({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'db offline',
        cause: 'Failed to retrieve user teams',
        data: undefined
      });
    });

    it('forwards a prisma NOT_FOUND failure with a fixed cause', async () => {
      signIn();
      prismaMock.team.findMany.mockRejectedValue(knownRequestError('P2025'));

      const result = await selectTeam({ id: 'alpha' });

      expect(expectFailure(result, 'NOT_FOUND')).toEqual({
        code: 'NOT_FOUND',
        message:
          'Unable to process your request. The item may no longer exist. Give us a minute before you try again.',
        cause: 'Failed to retrieve user teams',
        data: undefined
      });
    });

    it('forwards an UNAUTHORIZED failure when the session lapses between calls', async () => {
      authMock
        .mockResolvedValueOnce(createSession())
        .mockResolvedValueOnce(null);

      const result = await selectTeam({ id: 'alpha' });

      expect(expectFailure(result, 'UNAUTHORIZED')).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid session',
        cause: 'Failed to retrieve user teams',
        data: undefined
      });
      expect(prismaMock.team.findMany).not.toHaveBeenCalled();
    });

    it('forwards an output validation failure from loading teams', async () => {
      signIn();
      prismaMock.team.findMany.mockResolvedValue([
        { ...teamRecord('alpha', TeamRole.OWNER), name: 42 }
      ]);

      const result = await selectTeam({ id: 'alpha' });

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Output validation failed');
      expect(failure.cause).toBe('Failed to retrieve user teams');
    });
  });
});
