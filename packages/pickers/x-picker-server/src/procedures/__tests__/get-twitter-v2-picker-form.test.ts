import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { getTwitterV2PickerForm } from '../get-twitter-v2-picker-form';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildPicker, buildTeam } from '../../testing/fixtures-pickers';

describe('getTwitterV2PickerForm', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without reading the team or the picker', async () => {
      const result = await getTwitterV2PickerForm({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    describe('team access', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

        await getTwitterV2PickerForm({
          pickerId: 'picker-1',
          slug: 'dog-team'
        });

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('returns NOT_FOUND without reading the picker when the caller is not a member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);
        prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

        const result = await getTwitterV2PickerForm({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN without reading the picker for a blocked member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.BLOCKED })
        );
        prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

        const result = await getTwitterV2PickerForm({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: VIEW_PICKERS'
        );
        expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      });

      it('returns the form to a guest of a FREE team', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.GUEST, tier: TeamTier.FREE })
        );
        prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

        const result = await getTwitterV2PickerForm({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectOk(result).winners).toEqual({ quota: 1 });
      });

      it('loads the picker by id within the caller team', async () => {
        prismaMock.team.findUnique.mockResolvedValue({
          ...buildTeam(),
          id: 'team-7'
        });
        prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

        await getTwitterV2PickerForm({ pickerId: 'picker-42', slug: 'acme' });

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-42', teamId: 'team-7' }
        });
      });

      it('returns NOT_FOUND when the picker belongs to another team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await getTwitterV2PickerForm({
          pickerId: 'other-team-picker',
          slug: 'acme'
        });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Picker not found'
        );
      });
    });

    it('rejects a missing picker id', async () => {
      const result = await getTwitterV2PickerForm(
        {} as unknown as Parameters<typeof getTwitterV2PickerForm>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"pickerId"/
      );
    });

    it('returns NOT_FOUND when the picker does not exist', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

      const result = await getTwitterV2PickerForm({
        pickerId: 'missing',
        slug: 'acme'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Picker not found'
      );
    });

    it('maps a configured picker to form values', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(
        buildPicker({
          tweetUrls: ['https://x.com/a/status/1', 'https://x.com/b/status/2'],
          runAt: new Date('2025-07-01T09:30:00.000Z'),
          winners: 3,
          minPostCount: 10,
          minAccountAgeDays: 30,
          minFollowersCount: 50,
          minFollowingCount: 20,
          lastPostWithin: 'PAST_WEEK',
          requireProfileImage: true,
          requireBannerImage: true,
          requireLocation: true,
          requireBio: true
        })
      );

      const result = await getTwitterV2PickerForm({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectOk(result)).toEqual({
        setup: {
          postUrls: [
            { url: 'https://x.com/a/status/1' },
            { url: 'https://x.com/b/status/2' }
          ]
        },
        actions: { repost: true, reply: false },
        timing: { runAt: '2025-07-01T09:30:00.000Z', timeZone: 'UTC' },
        winners: { quota: 3 },
        filters: {
          minimumPostCount: 10,
          minimumAccountAgeDays: 30,
          minimumFollowers: 50,
          minimumFollowing: 20,
          hasProfileImage: true,
          hasBanner: true,
          hasLocation: true,
          hasDescription: true
        }
      });
    });

    it('provides one empty post url when the picker has none', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(
        buildPicker({ tweetUrls: [] })
      );

      const result = await getTwitterV2PickerForm({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectOk(result).setup).toEqual({ postUrls: [{ url: '' }] });
    });

    it('returns null timing when the picker is not scheduled', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(
        buildPicker({ runAt: null })
      );

      const result = await getTwitterV2PickerForm({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectOk(result).timing).toBeNull();
    });

    it('passes null numeric filters through and defaults null flags to false', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

      const result = await getTwitterV2PickerForm({
        pickerId: 'picker-1',
        slug: 'acme'
      });

      expect(expectOk(result).filters).toEqual({
        minimumPostCount: null,
        minimumAccountAgeDays: null,
        minimumFollowers: null,
        minimumFollowing: null,
        hasProfileImage: false,
        hasBanner: false,
        hasLocation: false,
        hasDescription: false
      });
    });

    it.each([
      ['requireProfileImage', 'hasProfileImage'],
      ['requireBannerImage', 'hasBanner'],
      ['requireLocation', 'hasLocation'],
      ['requireBio', 'hasDescription']
    ] as const)(
      'maps only the %s column to the %s flag',
      async (column, flag) => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(
          buildPicker({
            requireProfileImage: false,
            requireBannerImage: false,
            requireLocation: false,
            requireBio: false,
            [column]: true
          })
        );

        const result = await getTwitterV2PickerForm({
          pickerId: 'picker-1',
          slug: 'acme'
        });

        expect(expectOk(result).filters).toMatchObject({
          hasProfileImage: flag === 'hasProfileImage',
          hasBanner: flag === 'hasBanner',
          hasLocation: flag === 'hasLocation',
          hasDescription: flag === 'hasDescription'
        });
      }
    );
  });
});
