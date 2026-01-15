import {
  GIVEAWAYS_ENTERED_THRESHOLD,
  PLATFORM_BASE_SCORE,
  TWITTER_ACCOUNT_AGE_MAX,
  TWITTER_ACCOUNT_AGE_MONTHS_PER_POINT,
  TWITTER_DESCRIPTION_CHARS_PER_POINT,
  TWITTER_DESCRIPTION_MAX,
  TWITTER_FOLLOWERS_MAX,
  TWITTER_FOLLOWERS_PER_POINT,
  TWITTER_FOLLOWING_MAX,
  TWITTER_FOLLOWING_PER_POINT,
  TWITTER_GIVEAWAYS_MAX,
  TWITTER_LOCATION_BONUS,
  TWITTER_PROFILE_BANNER_BONUS,
  TWITTER_PROFILE_IMAGE_BONUS,
  TWITTER_TWEETS_MAX,
  TWITTER_TWEETS_PER_POINT,
  TWITTER_USERNAME_QUALITY_BONUS,
  TWITTER_VERIFIED_BONUS,
  TwitterScoreMetrics,
  twitterScoringDataSchema
} from '@/schemas/platform-scoring';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { datetime } from '../date';
import { Tx } from '../prisma';
import { clamp } from 'lodash';

// ============================================================================
// Twitter User Scoring (Platform-Specific)
// ============================================================================

export const computeTwitterUserScore = async (
  tx: Tx,
  userId: string,
  platformData: unknown
) => {
  try {
    const data = twitterScoringDataSchema.parse(platformData);

    // Count giveaways entered on our platform
    const giveawaysEntered = await tx.sweepstakesParticipant.count({
      where: { userId }
    });

    const metrics: TwitterScoreMetrics = {
      baseScore: PLATFORM_BASE_SCORE,
      profileImage: data.profile_image_url ? TWITTER_PROFILE_IMAGE_BONUS : 0,
      profileBanner: data.profile_banner_url ? TWITTER_PROFILE_BANNER_BONUS : 0,
      locationSet: data.location ? TWITTER_LOCATION_BONUS : 0,
      usernameQuality: calculateTwitterUsernameQuality(),
      description: calculateTwitterDescription(data.description),
      followers: calculateTwitterFollowers(
        data.public_metrics?.followers_count ?? 0
      ),
      following: calculateTwitterFollowing(
        data.public_metrics?.following_count ?? 0
      ),
      tweets: calculateTwitterTweets(data.public_metrics?.tweet_count ?? 0),
      giveawaysEntered: calculateGiveawaysEntered(giveawaysEntered),
      accountAge: calculateTwitterAccountAge(data.created_at),
      verified: data.verified ? TWITTER_VERIFIED_BONUS : 0,
      bannedAccount: 0 // Future: check ban status
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
    console.error(`Error scoring Twitter user ${userId}:`, error);
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
// Twitter Scoring Helper Functions
// ============================================================================

const calculateTwitterUsernameQuality = (): number => {
  return TWITTER_USERNAME_QUALITY_BONUS;
};

const calculateTwitterDescription = (description?: string): number => {
  if (!description) return 0;
  const length = description.length;
  return Math.min(
    TWITTER_DESCRIPTION_MAX,
    Math.floor(length / TWITTER_DESCRIPTION_CHARS_PER_POINT)
  );
};

const calculateTwitterFollowers = (count: number): number => {
  return Math.min(
    TWITTER_FOLLOWERS_MAX,
    Math.floor(count / TWITTER_FOLLOWERS_PER_POINT)
  );
};

const calculateTwitterFollowing = (count: number): number => {
  return Math.min(
    TWITTER_FOLLOWING_MAX,
    Math.floor(count / TWITTER_FOLLOWING_PER_POINT)
  );
};

const calculateTwitterTweets = (count: number): number => {
  return Math.min(
    TWITTER_TWEETS_MAX,
    Math.floor(count / TWITTER_TWEETS_PER_POINT)
  );
};

const calculateTwitterAccountAge = (createdAt?: string): number => {
  if (!createdAt) return 0;
  try {
    const ageInMonths = datetime.monthsSince(new Date(createdAt));
    return Math.min(
      TWITTER_ACCOUNT_AGE_MAX,
      Math.floor(ageInMonths / TWITTER_ACCOUNT_AGE_MONTHS_PER_POINT)
    );
  } catch (error) {
    console.error('Error calculating Twitter account age:', error);
    return 0;
  }
};

const calculateGiveawaysEntered = (count: number): number => {
  return Math.min(
    TWITTER_GIVEAWAYS_MAX,
    Math.floor(count / GIVEAWAYS_ENTERED_THRESHOLD)
  );
};
