import {
  DISCORD_COMMUNICATION_DISABLED_PENALTY,
  DISCORD_NITRO_BOOSTER_BONUS,
  DISCORD_PROFILE_AVATAR_BONUS,
  DISCORD_PROFILE_BANNER_BONUS,
  DISCORD_SERVER_TENURE_MAX,
  DISCORD_UNUSUAL_DM_PENALTY,
  DiscordScoreMetrics,
  discordScoringDataSchema,
  PLATFORM_BASE_SCORE
} from '@/lib/scoring/schemas';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { datetime } from '../date';
import { Tx } from '../prisma';
import { clamp } from 'lodash';

export const computeDiscordUserScore = async (
  tx: Tx,
  userId: string,
  platformData: unknown
) => {
  try {
    const data = discordScoringDataSchema.parse(platformData);

    const metrics: DiscordScoreMetrics = {
      baseScore: PLATFORM_BASE_SCORE,
      profileAvatar: data.avatar ? DISCORD_PROFILE_AVATAR_BONUS : 0,
      profileBanner: data.banner ? DISCORD_PROFILE_BANNER_BONUS : 0,
      serverTenure: calculateServerTenure(data.joinedAt),
      nitroBooster: data.premiumSince ? DISCORD_NITRO_BOOSTER_BONUS : 0,
      unusualDmActivity: data.unusualDmActivityUntil
        ? DISCORD_UNUSUAL_DM_PENALTY
        : 0,
      communicationDisabled: data.communicationDisabledUntil
        ? DISCORD_COMMUNICATION_DISABLED_PENALTY
        : 0
    };

    const score = Object.values(metrics).reduce((a, b) => a + b, 0);

    await tx.userQuality.create({
      data: {
        userId,
        score: clamp(score, 0, 100),
        metrics
      }
    });
  } catch (error) {
    console.error(`Error scoring Discord user ${userId}:`, error);
    await createBasicQualityRecord(tx, userId);
  }
};

const createBasicQualityRecord = async (tx: Tx, userId: string) => {
  await tx.userQuality.create({
    data: {
      userId,
      score: USER_BASE_SCORE,
      metrics: {
        baseScore: USER_BASE_SCORE,
        profileAvatar: 0,
        profileBanner: 0,
        serverTenure: 0,
        nitroBooster: 0,
        unusualDmActivity: 0,
        communicationDisabled: 0
      }
    }
  });
};

const calculateServerTenure = (joinedAt: string): number => {
  try {
    const months = datetime.monthsSince(new Date(joinedAt));
    return Math.min(DISCORD_SERVER_TENURE_MAX, months);
  } catch (error) {
    console.error('Error calculating Discord server tenure:', error);
    return 0;
  }
};
