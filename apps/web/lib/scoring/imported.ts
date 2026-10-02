import { IMPORTED_BASE_SCORE } from './schemas/imported';
import { Tx } from '../prisma';

export const computeImportedUserScore = async (tx: Tx, userId: string) => {
  await tx.userQuality.create({
    data: {
      userId,
      score: IMPORTED_BASE_SCORE
    }
  });
};
