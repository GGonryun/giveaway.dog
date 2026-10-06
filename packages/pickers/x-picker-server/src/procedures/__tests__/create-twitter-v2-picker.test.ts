import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { createTwitterPicker } from '../create-twitter-v2-picker';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildPicker, buildTeam } from '../../testing/fixtures-pickers';

describe('createTwitterPicker', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.create).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a slug', async () => {
      const result = await createTwitterPicker(
        {} as unknown as Parameters<typeof createTwitterPicker>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"slug"/
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('looks the team up by slug among the caller memberships', async () => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockResolvedValue(buildPicker());

      await createTwitterPicker({ slug: 'dog-team' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'dog-team',
          members: { some: { userId: TEST_USER.id } }
        },
        include: { members: true }
      });
    });

    it('creates a draft picker with the default filters', async () => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockResolvedValue(buildPicker());

      await createTwitterPicker({ slug: 'acme' });

      expect(prismaMock.twitterPicker.create).toHaveBeenCalledWith({
        data: {
          id: expect.stringMatching(/^[A-Za-z0-9_-]{10}$/),
          teamId: 'team-1',
          status: 'DRAFT',
          tweetUrls: [],
          winners: 1,
          minPostCount: 100,
          minAccountAgeDays: 100,
          minFollowersCount: 100,
          minFollowingCount: 100,
          lastPostWithin: 'PAST_MONTH',
          requireProfileImage: true,
          requireBannerImage: false,
          requireLocation: false,
          requireBio: false,
          runAt: null
        }
      });
    });

    it('generates a new id for every picker', async () => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockResolvedValue(buildPicker());

      await createTwitterPicker({ slug: 'acme' });
      await createTwitterPicker({ slug: 'acme' });

      const [first, second] = prismaMock.twitterPicker.create.mock.calls.map(
        ([args]) => args.data.id
      );
      expect(first).not.toBe(second);
    });

    it('returns only the id of the created picker', async () => {
      const created = buildPicker({ id: 'abcdefghij', status: 'DRAFT' });
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockResolvedValue(created);

      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectOk(result)).toStrictEqual({ id: 'abcdefghij' });
    });

    it.each([TeamTier.PRO, TeamTier.ELITE, TeamTier.ALPHA])(
      'allows a %s team',
      async (tier) => {
        prismaMock.team.findUnique.mockResolvedValue(buildTeam({ tier }));
        prismaMock.twitterPicker.create.mockResolvedValue(buildPicker());

        const result = await createTwitterPicker({ slug: 'acme' });

        expectOk(result);
      }
    );

    it.each([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER])(
      'allows a team %s',
      async (role) => {
        prismaMock.team.findUnique.mockResolvedValue(buildTeam({ role }));
        prismaMock.twitterPicker.create.mockResolvedValue(buildPicker());

        const result = await createTwitterPicker({ slug: 'acme' });

        expectOk(result);
      }
    );

    it('returns NOT_FOUND when the team does not exist', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await createTwitterPicker({ slug: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.twitterPicker.create).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller has no membership', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ userId: 'someone-else' })
      );

      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.twitterPicker.create).not.toHaveBeenCalled();
    });

    it.each([TeamRole.GUEST, TeamRole.BLOCKED])(
      'returns FORBIDDEN for a team %s',
      async (role) => {
        prismaMock.team.findUnique.mockResolvedValue(buildTeam({ role }));

        const result = await createTwitterPicker({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
        );
        expect(prismaMock.twitterPicker.create).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN for a FREE team', async () => {
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ tier: TeamTier.FREE })
      );

      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This feature requires a team with at least the PRO tier.'
      );
      expect(prismaMock.twitterPicker.create).not.toHaveBeenCalled();
    });

    it('fails output validation when the created row has no id', async () => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockResolvedValue({});

      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Output validation failed'
      );
    });

    it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      prismaMock.twitterPicker.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await createTwitterPicker({ slug: 'acme' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: [\w-]{6}$/
      );
    });
  });
});
