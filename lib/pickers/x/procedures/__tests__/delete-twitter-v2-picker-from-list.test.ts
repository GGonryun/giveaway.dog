import { describe, it, expect, beforeEach } from 'vitest';
import { deleteTwitterV2PickerFromList } from '../delete-twitter-v2-picker-from-list';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

describe('deleteTwitterV2PickerFromList', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without deleting anything', async () => {
      const result = await deleteTwitterV2PickerFromList({
        pickerId: 'picker-1'
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a missing picker id', async () => {
      const result = await deleteTwitterV2PickerFromList(
        {} as unknown as Parameters<typeof deleteTwitterV2PickerFromList>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.twitterPicker.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the picker by id', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

      await deleteTwitterV2PickerFromList({ pickerId: 'picker-1' });

      expect(prismaMock.twitterPicker.deleteMany).toHaveBeenCalledWith({
        where: { id: 'picker-1' }
      });
    });

    it('returns the delete count', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

      const result = await deleteTwitterV2PickerFromList({
        pickerId: 'picker-1'
      });

      expect(expectOk(result)).toEqual({ count: 1 });
    });

    it('succeeds with a zero count when the picker does not exist', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 0 });

      const result = await deleteTwitterV2PickerFromList({
        pickerId: 'missing'
      });

      expect(expectOk(result)).toEqual({ count: 0 });
    });

    it('does not check team membership before deleting', async () => {
      prismaMock.twitterPicker.deleteMany.mockResolvedValue({ count: 1 });

      await deleteTwitterV2PickerFromList({ pickerId: 'picker-1' });

      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
    });

    it('maps a database error to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.twitterPicker.deleteMany.mockRejectedValue(
        knownRequestError('P2003')
      );

      const result = await deleteTwitterV2PickerFromList({
        pickerId: 'picker-1'
      });

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
    });
  });
});
