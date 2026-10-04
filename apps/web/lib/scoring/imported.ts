import { IMPORTED_BASE_SCORE } from '@giveaway/scoring-model/schemas/imported';
import { Tx } from '@giveaway/db-client/prisma';

export const computeImportedUserScore = async (tx: Tx, userId: string) => {
  await tx.userQuality.create({
    data: {
      userId,
      score: IMPORTED_BASE_SCORE
    }
  });
};
