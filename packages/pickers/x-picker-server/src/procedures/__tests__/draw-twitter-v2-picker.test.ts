import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PickerStatus, TeamRole, TeamTier } from '@giveaway/db-model';
import { drawTwitterV2Picker } from '../draw-twitter-v2-picker';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  NOW,
  buildDraw,
  buildPicker,
  buildPickerUser,
  buildTeam,
  daysBeforeNow
} from '../../testing/fixtures-pickers';

const withoutKeys = (value: object, ...keys: string[]) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key))
  );

const users = (...ids: string[]) =>
  ids.map((id) => buildPickerUser({ id, userId: `x-${id}` }));

const mockPicker = (
  overrides: Parameters<typeof buildPicker>[0] = {},
  pickerUsers = users('u1', 'u2', 'u3'),
  draws: ReturnType<typeof buildDraw>[] = []
) => {
  prismaMock.twitterPicker.findUnique.mockResolvedValue({
    ...buildPicker(overrides),
    users: pickerUsers,
    draws
  });
};

const echoCreatedDraws = () => {
  prismaMock.twitterPickerDraw.create.mockImplementation(
    async ({ data }: { data: { pickerId: string; userId: string } }) =>
      buildDraw({ id: `draw-${data.userId}`, userId: data.userId })
  );
};

const drawnUserIds = () =>
  prismaMock.twitterPickerDraw.create.mock.calls.map(
    ([args]) => args.data.userId
  );

describe('drawTwitterV2Picker', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without reading the team or the picker', async () => {
      const result = await drawTwitterV2Picker({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);
      echoCreatedDraws();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    describe('with invalid input', () => {
      it('rejects a non-numeric count', async () => {
        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme',
          count: '2'
        } as unknown as Parameters<typeof drawTwitterV2Picker>[0]);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"count"/
        );
        expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      });
    });

    describe('team access', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        mockPicker();

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'dog-team' });

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND without reading the picker or drawing when the caller is not a member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);
        mockPicker();

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it.each([TeamRole.BLOCKED, TeamRole.GUEST])(
        'returns FORBIDDEN without reading the picker or drawing for a %s member',
        async (role) => {
          prismaMock.team.findUnique.mockResolvedValue(buildTeam({ role }));
          mockPicker();

          const result = await drawTwitterV2Picker({
            pickerId: 'picker-1',
            slug: 'acme'
          });

          expect(expectFailure(result, 'FORBIDDEN').message).toBe(
            'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
          );
          expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
          expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
        }
      );

      it('draws winners for a member of a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.MEMBER, tier: TeamTier.FREE })
        );
        mockPicker({ winners: 1 });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectOk(result)).toHaveLength(1);
      });

      it('loads the picker by id within the caller team with its users and draws', async () => {
        prismaMock.team.findUnique.mockResolvedValue({
          ...buildTeam(),
          id: 'team-7'
        });
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        await drawTwitterV2Picker({ pickerId: 'picker-42', slug: 'acme' });

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-42', teamId: 'team-7' },
          include: { users: true, draws: true }
        });
      });
    });

    describe('when the picker cannot be drawn', () => {
      it('returns NOT_FOUND when the picker is not in the caller team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await drawTwitterV2Picker({
          pickerId: 'missing',
          slug: 'acme'
        });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Picker not found'
        );
      });

      it.each([
        PickerStatus.DRAFT,
        PickerStatus.CREATED,
        PickerStatus.SCHEDULED,
        PickerStatus.PROCESSING,
        PickerStatus.PROCESSED,
        PickerStatus.CANCELLED,
        PickerStatus.FAILED,
        PickerStatus.SUSPENDED
      ])('returns BAD_REQUEST for a %s picker', async (status) => {
        mockPicker({ status });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'Picker must be in COMPLETE status to draw winners'
        );
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('returns BAD_REQUEST when the picker has no users', async () => {
        mockPicker({}, []);

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'No eligible users to draw from'
        );
      });

      it('returns BAD_REQUEST when every user is ineligible', async () => {
        mockPicker({ minFollowersCount: 10_000 });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'No eligible users to draw from'
        );
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('returns BAD_REQUEST when every eligible user already won', async () => {
        mockPicker({}, users('u1', 'u2'), [
          buildDraw({ id: 'd1', userId: 'u1' }),
          buildDraw({ id: 'd2', userId: 'u2' })
        ]);

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'All eligible users have already been drawn as winners'
        );
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('treats a disqualified past winner as already drawn', async () => {
        mockPicker({}, users('u1'), [
          buildDraw({ id: 'd1', userId: 'u1', disqualified: 'Bot' })
        ]);

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'All eligible users have already been drawn as winners'
        );
      });
    });

    describe('when winners can be drawn', () => {
      it('draws the picker winner quota by default', async () => {
        mockPicker({ winners: 2 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(drawnUserIds()).toEqual(['u1', 'u2']);
      });

      it('creates each draw for the picker and user', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(prismaMock.twitterPickerDraw.create).toHaveBeenCalledWith({
          data: { pickerId: 'picker-1', userId: 'u1' }
        });
      });

      it('creates the draws in a single transaction', async () => {
        mockPicker({ winners: 3 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(3);
      });

      it('returns the created draws without the picker id', async () => {
        mockPicker({ winners: 2 });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectOk(result)).toEqual(
          [
            buildDraw({ id: 'draw-u1', userId: 'u1' }),
            buildDraw({ id: 'draw-u2', userId: 'u2' })
          ].map((draw) => withoutKeys(draw, 'pickerId'))
        );
      });

      it('uses the requested count instead of the quota', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme',
          count: 3
        });

        expect(drawnUserIds()).toEqual(['u1', 'u2', 'u3']);
      });

      it('caps the count at the number of available users', async () => {
        mockPicker({ winners: 10 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(drawnUserIds()).toEqual(['u1', 'u2', 'u3']);
      });

      it('draws nobody for a count of zero', async () => {
        mockPicker({ winners: 2 });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme',
          count: 0
        });

        expect(expectOk(result)).toEqual([]);
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('draws all but the last available user for a count of -1', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme',
          count: -1
        });

        expect(drawnUserIds()).toEqual(['u1', 'u2']);
      });

      it('skips users who already won', async () => {
        mockPicker({ winners: 5 }, users('u1', 'u2', 'u3'), [
          buildDraw({ id: 'd1', userId: 'u2' })
        ]);

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(drawnUserIds()).toEqual(['u1', 'u3']);
      });

      it('skips users who fail the picker filters', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
        mockPicker({ winners: 5, minAccountAgeDays: 30, requireBio: true }, [
          buildPickerUser({ id: 'young', createdAt: daysBeforeNow(1) }),
          buildPickerUser({ id: 'no-bio', description: null }),
          buildPickerUser({ id: 'ok' })
        ]);

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(drawnUserIds()).toEqual(['ok']);
      });

      it('picks winners using the shuffled order', async () => {
        vi.mocked(Math.random).mockReturnValue(0);
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', slug: 'acme' });

        expect(drawnUserIds()).toEqual(['u2']);
      });
    });

    describe('when persisting the draws fails', () => {
      it('fails output validation when a created draw is malformed', async () => {
        mockPicker({ winners: 1 });
        prismaMock.twitterPickerDraw.create.mockResolvedValue({ id: 'd1' });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Output validation failed');
      });

      it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
        mockPicker({ winners: 1 });
        prismaMock.twitterPickerDraw.create.mockRejectedValue(
          knownRequestError('P2003')
        );

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
          /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: [\w-]{6}$/
        );
      });
    });
  });
});
