import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PickerStatus } from '@giveaway/db-model';
import { getTwitterV2PublicPicker } from '../get-twitter-v2-public-picker';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  DISQUALIFICATION_CASES,
  NOW,
  buildDraw,
  buildPicker,
  buildPickerUser,
  buildPost
} from '../../testing/fixtures-pickers';

const mockPicker = ({
  picker = {},
  users = [buildPickerUser()],
  draws = [buildDraw()],
  tweets = [buildPost()]
}: {
  picker?: Parameters<typeof buildPicker>[0];
  users?: ReturnType<typeof buildPickerUser>[];
  draws?: ReturnType<typeof buildDraw>[];
  tweets?: ReturnType<typeof buildPost>[];
} = {}) => {
  const row = { ...buildPicker(picker), users, draws, tweets };
  prismaMock.twitterPicker.findUnique.mockResolvedValue(row);
  return row;
};

describe('getTwitterV2PublicPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('authorization', () => {
    it('returns the picker to a signed out caller', async () => {
      mockPicker();

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).id).toBe('picker-1');
    });

    it('returns the picker to a signed in caller', async () => {
      signIn();
      mockPicker();

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).id).toBe('picker-1');
    });

    it.each([
      PickerStatus.COMPLETE,
      PickerStatus.SCHEDULED,
      PickerStatus.PROCESSING,
      PickerStatus.CREATED
    ])('exposes a %s picker', async (status) => {
      mockPicker({ picker: { status } });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).status).toBe(status);
    });

    it.each([
      PickerStatus.DRAFT,
      PickerStatus.PROCESSED,
      PickerStatus.CANCELLED,
      PickerStatus.FAILED,
      PickerStatus.SUSPENDED
    ])('returns FORBIDDEN for a %s picker', async (status) => {
      mockPicker({ picker: { status } });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Picker is not accessible'
      );
    });
  });

  describe('loading', () => {
    it('rejects a missing picker id', async () => {
      const result = await getTwitterV2PublicPicker(
        {} as unknown as Parameters<typeof getTwitterV2PublicPicker>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"pickerId"/
      );
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
    });

    it('loads the picker with its users, draws and tweets', async () => {
      mockPicker();

      await getTwitterV2PublicPicker({ pickerId: 'picker-42' });

      expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
        where: { id: 'picker-42' },
        include: { users: true, draws: true, tweets: true }
      });
    });

    it('returns NOT_FOUND when the picker does not exist', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

      const result = await getTwitterV2PublicPicker({ pickerId: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Picker not found'
      );
    });

    it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.twitterPicker.findUnique.mockRejectedValue(
        knownRequestError('P1001')
      );

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: [\w-]{6}$/
      );
    });

    it('fails output validation for a malformed picker row', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue({
        ...buildPicker(),
        users: [{ id: 'broken' }],
        draws: [],
        tweets: []
      });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Output validation failed'
      );
    });
  });

  describe('response', () => {
    it('returns the picker row with eligibility and stats', async () => {
      const row = mockPicker();

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result)).toEqual({
        ...row,
        users: [{ ...buildPickerUser(), ineligible: undefined }],
        stats: {
          totalParticipants: 1,
          sampleSize: 1,
          eligibleInSample: 1,
          estimatedEligible: 1
        }
      });
    });

    it('keeps the team id from the picker row', async () => {
      mockPicker({ picker: { teamId: 'team-9' } });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).teamId).toBe('team-9');
    });

    it('estimates stats from the sample for a picker without a team', async () => {
      mockPicker({
        picker: { teamId: null, minPostCount: 5000 },
        users: [
          buildPickerUser({ id: 'a' }),
          buildPickerUser({ id: 'b', tweetCount: 6000 }),
          buildPickerUser({ id: 'c', tweetCount: 7000 })
        ],
        tweets: [buildPost({ retweetCount: 10 })]
      });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).stats).toEqual({
        totalParticipants: 10,
        sampleSize: 3,
        eligibleInSample: 2,
        estimatedEligible: 7
      });
    });

    it('computes stats from actual counts for a team picker', async () => {
      mockPicker({
        picker: { requireLocation: true },
        users: [
          buildPickerUser({ id: 'a', location: null }),
          buildPickerUser({ id: 'b' })
        ],
        tweets: [buildPost({ retweetCount: 10 })]
      });

      const result = await getTwitterV2PublicPicker({ pickerId: 'picker-1' });

      expect(expectOk(result).stats).toEqual({
        totalParticipants: 2,
        sampleSize: 2,
        eligibleInSample: 1,
        estimatedEligible: 1
      });
    });
  });

  describe('user eligibility', () => {
    it.each(DISQUALIFICATION_CASES)(
      'marks $name',
      async ({ picker, user, reason }) => {
        mockPicker({ picker, users: [buildPickerUser(user)] });

        const result = await getTwitterV2PublicPicker({
          pickerId: 'picker-1'
        });

        expect(expectOk(result).users[0].ineligible).toBe(reason);
      }
    );
  });
});
