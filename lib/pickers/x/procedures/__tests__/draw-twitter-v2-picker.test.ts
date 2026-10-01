import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PickerStatus } from '@prisma/client';
import { drawTwitterV2Picker } from '../draw-twitter-v2-picker';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  NOW,
  buildDraw,
  buildPicker,
  buildPickerUser,
  daysBeforeNow
} from './fixtures-pickers';

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
    it('returns UNAUTHORIZED without loading the picker', async () => {
      const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
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
          count: '2'
        } as unknown as Parameters<typeof drawTwitterV2Picker>[0]);

        expectFailure(result, 'UNPROCESSABLE_CONTENT');
        expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      });
    });

    describe('when the picker cannot be drawn', () => {
      it('loads the picker with its users and draws', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-1' },
          include: { users: true, draws: true }
        });
      });

      it('returns NOT_FOUND when the picker does not exist', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await drawTwitterV2Picker({ pickerId: 'missing' });

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

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'Picker must be in COMPLETE status to draw winners'
        );
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('returns BAD_REQUEST when the picker has no users', async () => {
        mockPicker({}, []);

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'No eligible users to draw from'
        );
      });

      it('returns BAD_REQUEST when every user is ineligible', async () => {
        mockPicker({ minFollowersCount: 10_000 });

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

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

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'All eligible users have already been drawn as winners'
        );
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('treats a disqualified past winner as already drawn', async () => {
        mockPicker({}, users('u1'), [
          buildDraw({ id: 'd1', userId: 'u1', disqualified: 'Bot' })
        ]);

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
          'All eligible users have already been drawn as winners'
        );
      });
    });

    describe('when winners can be drawn', () => {
      it('draws the picker winner quota by default', async () => {
        mockPicker({ winners: 2 });

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(drawnUserIds()).toEqual(['u1', 'u2']);
      });

      it('creates each draw for the picker and user', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(prismaMock.twitterPickerDraw.create).toHaveBeenCalledWith({
          data: { pickerId: 'picker-1', userId: 'u1' }
        });
      });

      it('creates the draws in a single transaction', async () => {
        mockPicker({ winners: 3 });

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(3);
      });

      it('returns the created draws', async () => {
        mockPicker({ winners: 2 });

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(expectOk(result)).toEqual([
          buildDraw({ id: 'draw-u1', userId: 'u1' }),
          buildDraw({ id: 'draw-u2', userId: 'u2' })
        ]);
      });

      it('uses the requested count instead of the quota', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', count: 3 });

        expect(drawnUserIds()).toEqual(['u1', 'u2', 'u3']);
      });

      it('caps the count at the number of available users', async () => {
        mockPicker({ winners: 10 });

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(drawnUserIds()).toEqual(['u1', 'u2', 'u3']);
      });

      it('draws nobody for a count of zero', async () => {
        mockPicker({ winners: 2 });

        const result = await drawTwitterV2Picker({
          pickerId: 'picker-1',
          count: 0
        });

        expect(expectOk(result)).toEqual([]);
        expect(prismaMock.twitterPickerDraw.create).not.toHaveBeenCalled();
      });

      it('draws all but the last available user for a count of -1', async () => {
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1', count: -1 });

        expect(drawnUserIds()).toEqual(['u1', 'u2']);
      });

      it('skips users who already won', async () => {
        mockPicker({ winners: 5 }, users('u1', 'u2', 'u3'), [
          buildDraw({ id: 'd1', userId: 'u2' })
        ]);

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

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

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(drawnUserIds()).toEqual(['ok']);
      });

      it('picks winners using the shuffled order', async () => {
        vi.mocked(Math.random).mockReturnValue(0);
        mockPicker({ winners: 1 });

        await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(drawnUserIds()).toEqual(['u2']);
      });
    });

    describe('when persisting the draws fails', () => {
      it('fails output validation when a created draw is malformed', async () => {
        mockPicker({ winners: 1 });
        prismaMock.twitterPickerDraw.create.mockResolvedValue({ id: 'd1' });

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Output validation failed');
      });

      it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
        mockPicker({ winners: 1 });
        prismaMock.twitterPickerDraw.create.mockRejectedValue(
          knownRequestError('P2003')
        );

        const result = await drawTwitterV2Picker({ pickerId: 'picker-1' });

        expectFailure(result, 'INTERNAL_SERVER_ERROR');
      });
    });
  });
});
