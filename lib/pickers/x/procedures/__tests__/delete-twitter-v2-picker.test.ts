import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteTwitterV2Picker } from '../delete-twitter-v2-picker';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { buildPicker } from './fixtures-pickers';

const mocks = vi.hoisted(() => ({
  getWorld: vi.fn(),
  cancel: vi.fn()
}));

vi.mock('workflow/runtime', () => ({
  getWorld: mocks.getWorld
}));

describe('deleteTwitterV2Picker', () => {
  beforeEach(() => {
    mocks.cancel.mockReset();
    mocks.getWorld.mockReset();
    mocks.getWorld.mockReturnValue({ runs: { cancel: mocks.cancel } });
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without deleting anything', async () => {
      const result = await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPicker.delete).not.toHaveBeenCalled();
      expect(mocks.getWorld).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a non-string picker id', async () => {
      const result = await deleteTwitterV2Picker({
        pickerId: 42
      } as unknown as Parameters<typeof deleteTwitterV2Picker>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.twitterPicker.delete).not.toHaveBeenCalled();
    });

    it('deletes the picker by id', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(buildPicker());

      await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(prismaMock.twitterPicker.delete).toHaveBeenCalledWith({
        where: { id: 'picker-1' }
      });
    });

    it('returns the deleted picker', async () => {
      const deleted = buildPicker();
      prismaMock.twitterPicker.delete.mockResolvedValue(deleted);

      const result = await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(expectOk(result)).toEqual(deleted);
    });

    it('does not touch the workflow runtime when there is no run', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(
        buildPicker({ runId: null })
      );

      await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(mocks.getWorld).not.toHaveBeenCalled();
      expect(mocks.cancel).not.toHaveBeenCalled();
    });

    it('does not cancel a run with an empty run id', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(
        buildPicker({ runId: '' })
      );

      await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(mocks.cancel).not.toHaveBeenCalled();
    });

    it('cancels the associated workflow run', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(
        buildPicker({ runId: 'run-123' })
      );
      mocks.cancel.mockResolvedValue(undefined);

      const result = await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expectOk(result);
      expect(mocks.cancel).toHaveBeenCalledWith('run-123');
    });

    it('returns INTERNAL_SERVER_ERROR after deleting when the cancel fails', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(
        buildPicker({ runId: 'run-123' })
      );
      mocks.cancel.mockRejectedValue(new Error('run already finished'));

      const result = await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'run already finished'
      );
      expect(prismaMock.twitterPicker.delete).toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the picker does not exist', async () => {
      prismaMock.twitterPicker.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await deleteTwitterV2Picker({ pickerId: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(mocks.getWorld).not.toHaveBeenCalled();
    });

    it('does not check team membership before deleting', async () => {
      prismaMock.twitterPicker.delete.mockResolvedValue(buildPicker());

      await deleteTwitterV2Picker({ pickerId: 'picker-1' });

      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });
});
