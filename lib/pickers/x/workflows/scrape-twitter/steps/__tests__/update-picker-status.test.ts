import { describe, it, expect } from 'vitest';
import { PickerStatus } from '@prisma/client';
import { updatePickerStatus } from '../update-picker-status';
import { knownRequestError, prismaMock } from '@/test/prisma';

describe('updatePickerStatus', () => {
  it.each(Object.values(PickerStatus))(
    'writes the %s status to the picker',
    async (status) => {
      prismaMock.twitterPicker.update.mockResolvedValue({});

      await updatePickerStatus({ pickerId: 'picker-1', status });

      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
        where: { id: 'picker-1' },
        data: { status }
      });
    }
  );

  it('resolves without a value', async () => {
    prismaMock.twitterPicker.update.mockResolvedValue({ id: 'picker-1' });

    await expect(
      updatePickerStatus({ pickerId: 'picker-1', status: 'COMPLETE' })
    ).resolves.toBeUndefined();
  });

  it('propagates database errors', async () => {
    const error = knownRequestError('P2025');
    prismaMock.twitterPicker.update.mockRejectedValue(error);

    await expect(
      updatePickerStatus({ pickerId: 'missing', status: 'FAILED' })
    ).rejects.toBe(error);
  });
});
