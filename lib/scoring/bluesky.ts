import {
  BLUESKY_ACCOUNT_AGE_MAX,
  BLUESKY_ACCOUNT_AGE_MONTHS_PER_POINT,
  BLUESKY_DESCRIPTION_CHARS_PER_POINT,
  BLUESKY_DESCRIPTION_MAX,
  BLUESKY_FOLLOWERS_MAX,
  BLUESKY_FOLLOWERS_PER_POINT,
  BLUESKY_FOLLOWING_MAX,
  BLUESKY_FOLLOWING_PER_POINT,
  BLUESKY_HANDLE_QUALITY_BONUS,
  BLUESKY_POSTS_MAX,
  BLUESKY_POSTS_PER_POINT,
  BLUESKY_PROFILE_AVATAR_BONUS,
  BLUESKY_PROFILE_BANNER_BONUS,
  BlueskyScoreMetrics,
  blueskyScoringDataSchema,
  GIVEAWAYS_ENTERED_THRESHOLD,
  PLATFORM_BASE_SCORE
} from '@/schemas/platform-scoring';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { datetime } from '../date';
import { Tx } from '../prisma';
import { clamp } from 'lodash';

// ============================================================================
// Bluesky User Scoring (Platform-Specific)
// ============================================================================

export const computeBlueskyUserScore = async (
  tx: Tx,
  userId: string,
  platformData: unknown
) => {
  try {
    const data = blueskyScoringDataSchema.parse(platformData);

    // Count giveaways entered on our platform
    const giveawaysEntered = await tx.sweepstakesParticipant.count({
      where: { userId }
    });

    const metrics: BlueskyScoreMetrics = {
      baseScore: PLATFORM_BASE_SCORE,
      profileAvatar: data.avatar ? BLUESKY_PROFILE_AVATAR_BONUS : 0,
      profileBanner: data.banner ? BLUESKY_PROFILE_BANNER_BONUS : 0,
      handleQuality: calculateBlueskyHandleQuality(),
      description: calculateBlueskyDescription(data.description),
      followers: calculateBlueskyFollowers(data.followersCount ?? 0),
      following: calculateBlueskyFollowing(data.followsCount ?? 0),
      posts: calculateBlueskyPosts(data.postsCount ?? 0),
      giveawaysEntered: calculateGiveawaysEntered(giveawaysEntered),
      accountAge: calculateBlueskyAccountAge(data.createdAt)
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
    console.error(`Error scoring Bluesky user ${userId}:`, error);
    await createBasicQualityRecord(tx, userId);
  }
};

// ============================================================================
// Fallback Scoring
// ============================================================================

const createBasicQualityRecord = async (tx: Tx, userId: string) => {
  await tx.userQuality.create({
    data: {
      userId,
      score: USER_BASE_SCORE,
      metrics: {
        baseScore: USER_BASE_SCORE,
        deviceStability: 0,
        ipConsistency: 0,
        geoConsistency: 0,
        providersConnected: 0,
        emailVerified: 0,
        taskActivity: 0,
        taskDiversity: 0,
        accountAge: 0,
        overlappingIpAddresses: 0,
        overlappingFingerprints: 0,
        turnstileTrust: 0
      }
    }
  });
};

// ============================================================================
// Bluesky Scoring Helper Functions
// ============================================================================

const calculateBlueskyHandleQuality = (): number => {
  return BLUESKY_HANDLE_QUALITY_BONUS;
};

const calculateBlueskyDescription = (description?: string): number => {
  if (!description) return 0;
  const length = description.length;
  return Math.min(
    BLUESKY_DESCRIPTION_MAX,
    Math.floor(length / BLUESKY_DESCRIPTION_CHARS_PER_POINT)
  );
};

const calculateBlueskyFollowers = (count: number): number => {
  return Math.min(
    BLUESKY_FOLLOWERS_MAX,
    Math.floor(count / BLUESKY_FOLLOWERS_PER_POINT)
  );
};

const calculateBlueskyFollowing = (count: number): number => {
  return Math.min(
    BLUESKY_FOLLOWING_MAX,
    Math.floor(count / BLUESKY_FOLLOWING_PER_POINT)
  );
};

const calculateBlueskyPosts = (count: number): number => {
  return Math.min(
    BLUESKY_POSTS_MAX,
    Math.floor(count / BLUESKY_POSTS_PER_POINT)
  );
};

const calculateBlueskyAccountAge = (createdAt?: string): number => {
  if (!createdAt) return 0;
  try {
    const ageInMonths = datetime.monthsSince(new Date(createdAt));
    return Math.min(
      BLUESKY_ACCOUNT_AGE_MAX,
      Math.floor(ageInMonths / BLUESKY_ACCOUNT_AGE_MONTHS_PER_POINT)
    );
  } catch (error) {
    console.error('Error calculating Bluesky account age:', error);
    return 0;
  }
};

const calculateGiveawaysEntered = (count: number): number => {
  return Math.min(
    BLUESKY_ACCOUNT_AGE_MAX, // Using same max as account age per original code
    Math.floor(count / GIVEAWAYS_ENTERED_THRESHOLD)
  );
};
