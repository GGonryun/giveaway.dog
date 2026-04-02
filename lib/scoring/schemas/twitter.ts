import { widetype } from '@/lib/widetype';
import {
  AtSign,
  BadgeCheck,
  Clock,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LucideIcon,
  MapPin,
  MessageSquare,
  ShieldAlert,
  StarIcon,
  Trophy,
  UserPlus,
  Users
} from 'lucide-react';
import z from 'zod';

import {
  GIVEAWAYS_ENTERED_THRESHOLD,
  PLATFORM_BASE_SCORE,
  TWITTER_ACCOUNT_AGE_MONTHS_PER_POINT,
  TWITTER_DESCRIPTION_CHARS_PER_POINT,
  TWITTER_FOLLOWERS_PER_POINT,
  TWITTER_FOLLOWING_PER_POINT,
  TWITTER_TWEETS_PER_POINT
} from './shared';

export const twitterScoringDataSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  created_at: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  profile_image_url: z.string().optional(),
  profile_banner_url: z.string().optional(),
  verified: z.boolean().optional(),
  verified_type: z.string().nullable().optional(),
  public_metrics: z
    .object({
      followers_count: z.number(),
      following_count: z.number(),
      tweet_count: z.number(),
      listed_count: z.number().optional()
    })
    .optional()
});

export type TwitterScoringData = z.infer<typeof twitterScoringDataSchema>;

export const twitterScoreMetricsSchema = z.object({
  baseScore: z.number(),
  profileImage: z.number(),
  profileBanner: z.number(),
  locationSet: z.number(),
  usernameQuality: z.number(),
  description: z.number(),
  followers: z.number(),
  following: z.number(),
  tweets: z.number(),
  giveawaysEntered: z.number(),
  accountAge: z.number(),
  verified: z.number(),
  bannedAccount: z.number()
});

export type TwitterScoreMetrics = z.infer<typeof twitterScoreMetricsSchema>;
export type TwitterMetricKey = keyof TwitterScoreMetrics;

export const TWITTER_PROFILE_IMAGE_BONUS = 2;
export const TWITTER_PROFILE_BANNER_BONUS = 2;
export const TWITTER_LOCATION_BONUS = 2;
export const TWITTER_USERNAME_QUALITY_BONUS = 2;
export const TWITTER_DESCRIPTION_MAX = 2;
export const TWITTER_FOLLOWERS_MAX = 10;
export const TWITTER_FOLLOWING_MAX = 5;
export const TWITTER_TWEETS_MAX = 5;
export const TWITTER_GIVEAWAYS_MAX = 5;
export const TWITTER_ACCOUNT_AGE_MAX = 15;
export const TWITTER_VERIFIED_BONUS = 50;
export const TWITTER_BANNED_PENALTY = -100;

export const TWITTER_METRIC_MAX: Record<TwitterMetricKey, number> = {
  baseScore: PLATFORM_BASE_SCORE,
  profileImage: TWITTER_PROFILE_IMAGE_BONUS,
  profileBanner: TWITTER_PROFILE_BANNER_BONUS,
  locationSet: TWITTER_LOCATION_BONUS,
  usernameQuality: TWITTER_USERNAME_QUALITY_BONUS,
  description: TWITTER_DESCRIPTION_MAX,
  followers: TWITTER_FOLLOWERS_MAX,
  following: TWITTER_FOLLOWING_MAX,
  tweets: TWITTER_TWEETS_MAX,
  giveawaysEntered: TWITTER_GIVEAWAYS_MAX,
  accountAge: TWITTER_ACCOUNT_AGE_MAX,
  verified: TWITTER_VERIFIED_BONUS,
  bannedAccount: 0
};

export const TWITTER_METRIC_LABELS: Record<TwitterMetricKey, string> = {
  baseScore: 'Base Score',
  profileImage: 'Profile Image',
  profileBanner: 'Profile Banner',
  locationSet: 'Location Set',
  usernameQuality: 'Username Quality',
  description: 'Bio Description',
  followers: 'Followers',
  following: 'Following',
  tweets: 'Tweet Activity',
  giveawaysEntered: 'Giveaways Entered',
  accountAge: 'Account Age',
  verified: 'Verified Status',
  bannedAccount: 'Account Status'
};

export const TWITTER_METRIC_ICONS: Record<TwitterMetricKey, LucideIcon> = {
  baseScore: StarIcon,
  profileImage: ImageIcon,
  profileBanner: LayoutDashboard,
  locationSet: MapPin,
  usernameQuality: AtSign,
  description: FileText,
  followers: Users,
  following: UserPlus,
  tweets: MessageSquare,
  giveawaysEntered: Trophy,
  accountAge: Clock,
  verified: BadgeCheck,
  bannedAccount: ShieldAlert
};

export const TWITTER_METRIC_DESCRIPTION: Record<TwitterMetricKey, string> = {
  baseScore: `The foundational score assigned to all users, representing their initial trustworthiness on the platform. Fixed at +${PLATFORM_BASE_SCORE} points.`,
  profileImage: `Users with a profile image appear more legitimate and trustworthy. Complete profiles indicate genuine engagement. Awards +${TWITTER_PROFILE_IMAGE_BONUS} points when set.`,
  profileBanner: `Profile banners show account customization effort. Users who personalize their accounts are more likely to be authentic. Awards +${TWITTER_PROFILE_BANNER_BONUS} points when set.`,
  locationSet: `A set location adds credibility to the user profile. Geographic information helps verify account authenticity. Awards +${TWITTER_LOCATION_BONUS} points when set.`,
  usernameQuality: `Having a username set indicates an active account. Awards +${TWITTER_USERNAME_QUALITY_BONUS} points.`,
  description: `A detailed bio description indicates a real person behind the account. Longer descriptions show genuine user investment. Awards +1 point per ${TWITTER_DESCRIPTION_CHARS_PER_POINT} characters (max +${TWITTER_DESCRIPTION_MAX} points).`,
  followers: `Follower count reflects social proof and account legitimacy. Higher follower counts generally indicate established accounts. Awards +1 point per ${TWITTER_FOLLOWERS_PER_POINT} followers (max +${TWITTER_FOLLOWERS_MAX} points).`,
  following: `Following count shows platform engagement. Accounts that follow others demonstrate active participation in the community. Awards +1 point per ${TWITTER_FOLLOWING_PER_POINT} accounts followed (max +${TWITTER_FOLLOWING_MAX} points).`,
  tweets: `Tweet activity demonstrates active platform usage. Regular posting indicates a genuine, engaged user rather than a bot. Awards +1 point per ${TWITTER_TWEETS_PER_POINT} tweets posted (max +${TWITTER_TWEETS_MAX} points).`,
  giveawaysEntered: `Number of giveaways entered on our platform. Consistent participation indicates a legitimate user interested in giveaways. Awards +1 point per ${GIVEAWAYS_ENTERED_THRESHOLD} giveaways entered (max +${TWITTER_GIVEAWAYS_MAX} points).`,
  accountAge: `Older accounts are generally more trustworthy. Account age helps distinguish between established users and newly created bot accounts. Awards +1 point per ${TWITTER_ACCOUNT_AGE_MONTHS_PER_POINT} months of account age (max +${TWITTER_ACCOUNT_AGE_MAX} points).`,
  verified: `Twitter verification badge indicates the account has been authenticated by the platform. Verified users receive a significant trust boost of +${TWITTER_VERIFIED_BONUS} points.`,
  bannedAccount: `Accounts that have been suspended or banned by Twitter are flagged as high risk. This is a strong negative indicator that applies ${TWITTER_BANNED_PENALTY} points.`
};

export const TWITTER_METRIC_TYPE: Record<
  TwitterMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus',
  profileImage: 'quality',
  profileBanner: 'quality',
  locationSet: 'quality',
  usernameQuality: 'quality',
  description: 'quality',
  followers: 'quality',
  following: 'quality',
  tweets: 'quality',
  giveawaysEntered: 'quality',
  accountAge: 'quality',
  verified: 'bonus',
  bannedAccount: 'risk'
};

export const TWITTER_QUALITY_METRICS: TwitterMetricKey[] = widetype
  .keys(TWITTER_METRIC_TYPE)
  .filter((key) => TWITTER_METRIC_TYPE[key] === 'quality');

export const TWITTER_RISK_METRICS: TwitterMetricKey[] = widetype
  .keys(TWITTER_METRIC_TYPE)
  .filter((key) => TWITTER_METRIC_TYPE[key] === 'risk');

export const TWITTER_BONUS_METRICS: TwitterMetricKey[] = widetype
  .keys(TWITTER_METRIC_TYPE)
  .filter((key) => TWITTER_METRIC_TYPE[key] === 'bonus');

export const TWITTER_METRIC_KEYS: TwitterMetricKey[] = widetype.keys(
  TWITTER_METRIC_LABELS
);
