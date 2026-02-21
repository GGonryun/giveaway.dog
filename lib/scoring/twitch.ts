import { PLATFORM_BASE_SCORE } from './schemas';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { Tx } from '../prisma';

export const computeTwitchUserScore = async (tx: Tx, userId: string) => {
  try {
    const metrics = { baseScore: PLATFORM_BASE_SCORE };

    await tx.userQuality.create({
      data: {
        userId,
        score: PLATFORM_BASE_SCORE,
        metrics
      }
    });
  } catch (error) {
    console.error(`Error scoring Twitch user ${userId}:`, error);
    await tx.userQuality.create({
      data: {
        userId,
        score: USER_BASE_SCORE,
        metrics: { baseScore: USER_BASE_SCORE }
      }
    });
  }
};
