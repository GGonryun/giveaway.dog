import { PickerStatus } from '@giveaway/db-model';
import z from 'zod';

export const twitterPostSchema = z.object({
  id: z.string(),
  tweetId: z.string(),
  text: z.string().nullable(),
  createdAt: z.coerce.date(),
  userId: z.string().nullable(),
  username: z.string().nullable(),
  favoriteCount: z.number().nullable(),
  retweetCount: z.number().nullable(),
  replyCount: z.number().nullable(),
  viewCount: z.number().nullable(),
  quoteCount: z.number().nullable()
});

export type TwitterPostSchema = z.infer<typeof twitterPostSchema>;

export const twitterV2PickerUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  location: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  bannerImageUrl: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
  canDm: z.boolean().nullable(),
  followersCount: z.number().nullable(),
  followingCount: z.number().nullable(),
  tweetCount: z.number().nullable(),
  verified: z.boolean().nullable(),
  ineligible: z.string().optional()
});

export type TwitterV2PickerUserSchema = z.infer<
  typeof twitterV2PickerUserSchema
>;

export const twitterV2PickerDrawSchema = z.object({
  id: z.string(),
  userId: z.string(),
  disqualified: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type TwitterV2PickerDrawSchema = z.infer<
  typeof twitterV2PickerDrawSchema
>;

export const twitterV2PickerStatsSchema = z.object({
  totalParticipants: z.number(),
  sampleSize: z.number(),
  eligibleInSample: z.number(),
  estimatedEligible: z.number()
});

export type TwitterV2PickerStatsSchema = z.infer<
  typeof twitterV2PickerStatsSchema
>;

export const twitterV2PickerSchema = z.object({
  id: z.string(),
  runId: z.string().nullable(),
  teamId: z.string().nullish(),
  tweetUrls: z.array(z.string()),
  status: z.nativeEnum(PickerStatus),
  winners: z.number(),
  minPostCount: z.number().nullable(),
  minAccountAgeDays: z.number().nullable(),
  minFollowersCount: z.number().nullable(),
  minFollowingCount: z.number().nullable(),
  requireProfileImage: z.boolean().nullable(),
  requireBannerImage: z.boolean().nullable(),
  requireLocation: z.boolean().nullable(),
  requireBio: z.boolean().nullable(),
  runAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  users: z.array(twitterV2PickerUserSchema),
  draws: z.array(twitterV2PickerDrawSchema),
  tweets: z.array(twitterPostSchema),
  stats: twitterV2PickerStatsSchema
});

export type TwitterV2PickerSchema = z.infer<typeof twitterV2PickerSchema>;

export const calculateTwitterV2PickerStats = (picker: {
  teamId?: string | null;
  users: TwitterV2PickerUserSchema[];
  tweets: TwitterPostSchema[];
}): TwitterV2PickerStatsSchema => {
  const sampleSize = picker.users.length;
  const eligibleInSample = picker.users.filter((u) => !u.ineligible).length;

  // For public giveaways (no teamId), use sampling
  if (!picker.teamId && picker.tweets.length > 0) {
    const tweet = picker.tweets[0];
    const totalParticipants = tweet.retweetCount || 0;

    // Calculate eligibility rate from sample
    const eligibilityRate = sampleSize > 0 ? eligibleInSample / sampleSize : 0;

    // Estimate total eligible based on sample
    const estimatedEligible = Math.round(totalParticipants * eligibilityRate);

    return {
      totalParticipants,
      sampleSize,
      eligibleInSample,
      estimatedEligible
    };
  }

  // For team-based pickers, use actual counts (no sampling)
  return {
    totalParticipants: sampleSize,
    sampleSize,
    eligibleInSample,
    estimatedEligible: eligibleInSample
  };
};
