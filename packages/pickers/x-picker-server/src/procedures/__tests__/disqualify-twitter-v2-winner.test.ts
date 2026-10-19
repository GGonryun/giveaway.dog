import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { disqualifyTwitterV2Winner } from '../disqualify-twitter-v2-winner';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildDraw, buildTeam } from '../../testing/fixtures-pickers';

type DisqualifyInput = Parameters<typeof disqualifyTwitterV2Winner>[0];

const input = (overrides: Partial<DisqualifyInput> = {}): DisqualifyInput => ({
  drawId: 'draw-1',
  slug: 'acme',
  reason: 'Bot account',
  ...overrides
});

const expectNoDrawAccess = () => {
  expect(prismaMock.twitterPickerDraw.findUnique).not.toHaveBeenCalled();
  expect(prismaMock.twitterPickerDraw.update).not.toHaveBeenCalled();
};

describe('disqualifyTwitterV2Winner', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await disqualifyTwitterV2Winner(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expectNoDrawAccess();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    describe('with invalid input', () => {
      it('requires a non-empty reason', async () => {
        const result = await disqualifyTwitterV2Winner(input({ reason: '' }));

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Reason is required');
        expectNoDrawAccess();
      });

      it('requires a draw id', async () => {
        const result = await disqualifyTwitterV2Winner({
          slug: 'acme',
          reason: 'Bot account'
        } as unknown as DisqualifyInput);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"drawId"/
        );
      });

      it('requires a slug', async () => {
        const result = await disqualifyTwitterV2Winner({
          drawId: 'draw-1',
          reason: 'Bot account'
        } as unknown as DisqualifyInput);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"slug"/
        );
        expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
        expectNoDrawAccess();
      });
    });

    describe('team access', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

        await disqualifyTwitterV2Winner(input({ slug: 'dog-team' }));

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND without reading or updating the draw when the caller is not a member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);
        prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

        const result = await disqualifyTwitterV2Winner(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expectNoDrawAccess();
      });

      it.each([TeamRole.BLOCKED, TeamRole.GUEST])(
        'returns FORBIDDEN without reading or updating the draw for a %s member',
        async (role) => {
          prismaMock.team.findUnique.mockResolvedValue(buildTeam({ role }));
          prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(
            buildDraw()
          );

          const result = await disqualifyTwitterV2Winner(input());

          expect(expectFailure(result, 'FORBIDDEN').message).toBe(
            'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
          );
          expectNoDrawAccess();
        }
      );

      it('disqualifies the winner for a member of a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.MEMBER, tier: TeamTier.FREE })
        );
        prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

        const result = await disqualifyTwitterV2Winner(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('looks the draw up by id among the pickers of the caller team', async () => {
        prismaMock.team.findUnique.mockResolvedValue({
          ...buildTeam(),
          id: 'team-7'
        });
        prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

        await disqualifyTwitterV2Winner(input({ drawId: 'draw-42' }));

        expect(prismaMock.twitterPickerDraw.findUnique).toHaveBeenCalledWith({
          where: { id: 'draw-42', picker: { teamId: 'team-7' } }
        });
      });

      it('returns NOT_FOUND without updating when the draw is not in the caller team', async () => {
        prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(null);

        const result = await disqualifyTwitterV2Winner(
          input({ drawId: 'other-team-draw' })
        );

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Draw not found'
        );
        expect(prismaMock.twitterPickerDraw.update).not.toHaveBeenCalled();
      });
    });

    it('stores the reason on the draw', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      await disqualifyTwitterV2Winner(input({ drawId: 'draw-42' }));

      expect(prismaMock.twitterPickerDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-42' },
        data: { disqualified: 'Bot account' }
      });
    });

    it('returns success', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      const result = await disqualifyTwitterV2Winner(input());

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('overwrites an existing disqualification reason', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(
        buildDraw({ disqualified: 'Old reason' })
      );

      await disqualifyTwitterV2Winner(input({ reason: 'New reason' }));

      expect(prismaMock.twitterPickerDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        data: { disqualified: 'New reason' }
      });
    });

    it('returns NOT_FOUND when the draw disappears before the update', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());
      prismaMock.twitterPickerDraw.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await disqualifyTwitterV2Winner(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
