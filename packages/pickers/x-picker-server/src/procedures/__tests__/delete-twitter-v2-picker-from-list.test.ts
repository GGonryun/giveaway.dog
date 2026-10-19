import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { deleteTwitterV2PickerFromList } from '../delete-twitter-v2-picker-from-list';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildTeam } from '../../testing/fixtures-pickers';

type DeleteInput = Parameters<typeof deleteTwitterV2PickerFromList>[0];

const input = (overrides: Partial<DeleteInput> = {}): DeleteInput => ({
  pickerId: 'picker-1',
  slug: 'acme',
  ...overrides
});

describe('deleteTwitterV2PickerFromList', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without deleting anything', async () => {
      const result = await deleteTwitterV2PickerFromList(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    it('rejects a missing picker id', async () => {
      const result = await deleteTwitterV2PickerFromList({
        slug: 'acme'
      } as unknown as DeleteInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"pickerId"/
      );
      expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
    });

    it('rejects a missing slug', async () => {
      const result = await deleteTwitterV2PickerFromList({
        pickerId: 'picker-1'
      } as unknown as DeleteInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"slug"/
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
    });

    describe('team access', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

        await deleteTwitterV2PickerFromList(input({ slug: 'dog-team' }));

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND without deleting when the caller is not a member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);

        const result = await deleteTwitterV2PickerFromList(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
      });

      it.each([TeamRole.BLOCKED, TeamRole.GUEST])(
        'returns FORBIDDEN without deleting for a %s member',
        async (role) => {
          prismaMock.team.findUnique.mockResolvedValue(buildTeam({ role }));

          const result = await deleteTwitterV2PickerFromList(input());

          expect(expectFailure(result, 'FORBIDDEN').message).toBe(
            'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
          );
          expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
        }
      );

      it('deletes the picker for a member of a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.MEMBER, tier: TeamTier.FREE })
        );
        prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

        const result = await deleteTwitterV2PickerFromList(input());

        expect(expectOk(result)).toEqual({ count: 1 });
      });

      it('deletes the picker by id within the caller team', async () => {
        prismaMock.team.findUnique.mockResolvedValue({
          ...buildTeam(),
          id: 'team-7'
        });
        prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

        await deleteTwitterV2PickerFromList(input({ pickerId: 'picker-42' }));

        expect(prismaMock.twitterPicker.deleteMany).toHaveBeenCalledWith({
          where: { id: 'picker-42', teamId: 'team-7' }
        });
      });
    });

    it('returns the delete count', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

      const result = await deleteTwitterV2PickerFromList(input());

      expect(expectOk(result)).toEqual({ count: 1 });
    });

    it('succeeds with a zero count when the picker is not in the caller team', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 0 });

      const result = await deleteTwitterV2PickerFromList(
        input({ pickerId: 'missing' })
      );

      expect(expectOk(result)).toEqual({ count: 0 });
    });

    it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.twitterPicker.deleteMany.mockRejectedValue(
        knownRequestError('P2003')
      );

      const result = await deleteTwitterV2PickerFromList(input());

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: [\w-]{6}$/
      );
    });
  });
});
