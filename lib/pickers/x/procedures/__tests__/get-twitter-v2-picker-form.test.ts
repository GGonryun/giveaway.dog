import { describe, it, expect, beforeEach } from 'vitest';
import { getTwitterV2PickerForm } from '../get-twitter-v2-picker-form';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { buildPicker } from './fixtures-pickers';

describe('getTwitterV2PickerForm', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without loading the picker', async () => {
      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing picker id', async () => {
      const result = await getTwitterV2PickerForm(
        {} as unknown as Parameters<typeof getTwitterV2PickerForm>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('loads the picker by id', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

      await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
        where: { id: 'picker-1' }
      });
    });

    it('returns NOT_FOUND when the picker does not exist', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

      const result = await getTwitterV2PickerForm({ pickerId: 'missing' });

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

      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

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
          lastPostWithin: 'PAST_WEEK',
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

      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expect(expectOk(result).setup).toEqual({ postUrls: [{ url: '' }] });
    });

    it('returns null timing when the picker is not scheduled', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(
        buildPicker({ runAt: null })
      );

      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expect(expectOk(result).timing).toBeNull();
    });

    it('passes null numeric filters through and defaults null flags to false', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());

      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expect(expectOk(result).filters).toEqual({
        minimumPostCount: null,
        minimumAccountAgeDays: null,
        minimumFollowers: null,
        minimumFollowing: null,
        lastPostWithin: null,
        hasProfileImage: false,
        hasBanner: false,
        hasLocation: false,
        hasDescription: false
      });
    });

    it('does not check that the caller owns the picker', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(
        buildPicker({ teamId: 'another-team' })
      );

      const result = await getTwitterV2PickerForm({ pickerId: 'picker-1' });

      expectOk(result);
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });
});
