import { describe, it, expect } from 'vitest';
import { computeImportedUserScore } from '../imported';
import {
  prismaMock,
  asPrismaClient,
  createPrismaMock
} from '@giveaway/testing-server/prisma';

describe('computeImportedUserScore', () => {
  it('creates a quality entry with the imported base score of 50', async () => {
    await computeImportedUserScore(asPrismaClient(), 'user-7');

    expect(prismaMock.userQuality.create).toHaveBeenCalledWith({
      data: { userId: 'user-7', score: 50 }
    });
  });

  it('writes through the transaction client it is given', async () => {
    const tx = createPrismaMock();

    await computeImportedUserScore(asPrismaClient(tx), 'user-8');

    expect(tx.userQuality.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.userQuality.create).not.toHaveBeenCalled();
  });

  it('does not read any user data', async () => {
    await computeImportedUserScore(asPrismaClient(), 'user-7');

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('resolves to undefined', async () => {
    prismaMock.userQuality.create.mockResolvedValue({ id: 'quality-1' });

    await expect(
      computeImportedUserScore(asPrismaClient(), 'user-7')
    ).resolves.toBeUndefined();
  });

  it('propagates database errors', async () => {
    prismaMock.userQuality.create.mockRejectedValue(new Error('db down'));

    await expect(
      computeImportedUserScore(asPrismaClient(), 'user-7')
    ).rejects.toThrow('db down');
  });
});
