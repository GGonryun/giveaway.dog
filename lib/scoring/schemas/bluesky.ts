import { widetype } from '@/lib/widetype';
import {
  Activity,
  AtSign,
  Clock,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LucideIcon,
  StarIcon,
  Trophy,
  UserPlus,
  Users
} from 'lucide-react';
import z from 'zod';

import {
  BLUESKY_ACCOUNT_AGE_MONTHS_PER_POINT,
  BLUESKY_DESCRIPTION_CHARS_PER_POINT,
  BLUESKY_FOLLOWERS_PER_POINT,
  BLUESKY_FOLLOWING_PER_POINT,
  BLUESKY_POSTS_PER_POINT,
  GIVEAWAYS_ENTERED_THRESHOLD,
  PLATFORM_BASE_SCORE
} from './shared';

export const blueskyScoringDataSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  banner: z.string().optional(),
  followersCount: z.number().optional(),
  followsCount: z.number().optional(),
  postsCount: z.number().optional(),
  createdAt: z.string().optional()
});

export type BlueskyScoringData = z.infer<typeof blueskyScoringDataSchema>;

export const blueskyScoreMetricsSchema = z.object({
  baseScore: z.number(),
  profileAvatar: z.number(),
  profileBanner: z.number(),
  handleQuality: z.number(),
  description: z.number(),
  followers: z.number(),
  following: z.number(),
  posts: z.number(),
  giveawaysEntered: z.number(),
  accountAge: z.number()
});

export type BlueskyScoreMetrics = z.infer<typeof blueskyScoreMetricsSchema>;
export type BlueskyMetricKey = keyof BlueskyScoreMetrics;

export const BLUESKY_PROFILE_AVATAR_BONUS = 2.5;
export const BLUESKY_PROFILE_BANNER_BONUS = 2.5;
export const BLUESKY_HANDLE_QUALITY_BONUS = 2.5;
export const BLUESKY_DESCRIPTION_MAX = 2.5;
export const BLUESKY_FOLLOWERS_MAX = 15;
export const BLUESKY_FOLLOWING_MAX = 7.5;
export const BLUESKY_POSTS_MAX = 7.5;
export const BLUESKY_GIVEAWAYS_MAX = 7.5;
export const BLUESKY_ACCOUNT_AGE_MAX = 15;

export const BLUESKY_METRIC_MAX: Record<BlueskyMetricKey, number> = {
  baseScore: PLATFORM_BASE_SCORE,
  profileAvatar: BLUESKY_PROFILE_AVATAR_BONUS,
  profileBanner: BLUESKY_PROFILE_BANNER_BONUS,
  handleQuality: BLUESKY_HANDLE_QUALITY_BONUS,
  description: BLUESKY_DESCRIPTION_MAX,
  followers: BLUESKY_FOLLOWERS_MAX,
  following: BLUESKY_FOLLOWING_MAX,
  posts: BLUESKY_POSTS_MAX,
  giveawaysEntered: BLUESKY_GIVEAWAYS_MAX,
  accountAge: BLUESKY_ACCOUNT_AGE_MAX
};

export const BLUESKY_METRIC_LABELS: Record<BlueskyMetricKey, string> = {
  baseScore: 'Base Score',
  profileAvatar: 'Profile Avatar',
  profileBanner: 'Profile Banner',
  handleQuality: 'Handle Quality',
  description: 'Bio Description',
  followers: 'Followers',
  following: 'Following',
  posts: 'Post Activity',
  giveawaysEntered: 'Giveaways Entered',
  accountAge: 'Account Age'
};

export const BLUESKY_METRIC_ICONS: Record<BlueskyMetricKey, LucideIcon> = {
  baseScore: StarIcon,
  profileAvatar: ImageIcon,
  profileBanner: LayoutDashboard,
  handleQuality: AtSign,
  description: FileText,
  followers: Users,
  following: UserPlus,
  posts: Activity,
  giveawaysEntered: Trophy,
  accountAge: Clock
};

export const BLUESKY_METRIC_DESCRIPTION: Record<BlueskyMetricKey, string> = {
  baseScore:
    `The foundational score assigned to all users, representing their initial trustworthiness on the platform. Fixed at +${PLATFORM_BASE_SCORE} points.`,
  profileAvatar:
    `Users with a profile avatar appear more legitimate and trustworthy. Complete profiles indicate genuine engagement on the platform. Awards +${BLUESKY_PROFILE_AVATAR_BONUS} points when set.`,
  profileBanner:
    `Profile banners show account customization effort. Users who personalize their accounts are more likely to be authentic. Awards +${BLUESKY_PROFILE_BANNER_BONUS} points when set.`,
  handleQuality:
    `Having a handle set indicates an active account. Awards +${BLUESKY_HANDLE_QUALITY_BONUS} points.`,
  description:
    `A detailed bio description indicates a real person behind the account. Longer descriptions show genuine user investment. Awards +1 point per ${BLUESKY_DESCRIPTION_CHARS_PER_POINT} characters (max +${BLUESKY_DESCRIPTION_MAX} points).`,
  followers:
    `Follower count reflects social proof and account legitimacy. Higher follower counts generally indicate established accounts. Awards +1 point per ${BLUESKY_FOLLOWERS_PER_POINT} followers (max +${BLUESKY_FOLLOWERS_MAX} points).`,
  following:
    `Following count shows platform engagement. Accounts that follow others demonstrate active participation in the community. Awards +1 point per ${BLUESKY_FOLLOWING_PER_POINT} accounts followed (max +${BLUESKY_FOLLOWING_MAX} points).`,
  posts:
    `Post activity demonstrates active platform usage. Regular posting indicates a genuine, engaged user rather than a bot. Awards +1 point per ${BLUESKY_POSTS_PER_POINT} posts (max +${BLUESKY_POSTS_MAX} points).`,
  giveawaysEntered:
    `Number of giveaways entered on our platform. Consistent participation indicates a legitimate user interested in giveaways. Awards +1 point per ${GIVEAWAYS_ENTERED_THRESHOLD} giveaways entered (max +${BLUESKY_GIVEAWAYS_MAX} points).`,
  accountAge:
    `Older accounts are generally more trustworthy. Account age helps distinguish between established users and newly created bot accounts. Awards +1 point per ${BLUESKY_ACCOUNT_AGE_MONTHS_PER_POINT} months of account age (max +${BLUESKY_ACCOUNT_AGE_MAX} points).`
};

export const BLUESKY_METRIC_TYPE: Record<
  BlueskyMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus',
  profileAvatar: 'quality',
  profileBanner: 'quality',
  handleQuality: 'quality',
  description: 'quality',
  followers: 'quality',
  following: 'quality',
  posts: 'quality',
  giveawaysEntered: 'quality',
  accountAge: 'quality'
};

export const BLUESKY_QUALITY_METRICS: BlueskyMetricKey[] = widetype
  .keys(BLUESKY_METRIC_TYPE)
  .filter((key) => BLUESKY_METRIC_TYPE[key] === 'quality');

export const BLUESKY_RISK_METRICS: BlueskyMetricKey[] = widetype
  .keys(BLUESKY_METRIC_TYPE)
  .filter((key) => BLUESKY_METRIC_TYPE[key] === 'risk');

export const BLUESKY_BONUS_METRICS: BlueskyMetricKey[] = widetype
  .keys(BLUESKY_METRIC_TYPE)
  .filter((key) => BLUESKY_METRIC_TYPE[key] === 'bonus');

export const BLUESKY_METRIC_KEYS: BlueskyMetricKey[] = widetype.keys(
  BLUESKY_METRIC_LABELS
);
