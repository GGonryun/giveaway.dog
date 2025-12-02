import z from 'zod';

import { CompletionStatus, Task } from '@prisma/client';
import {
  xStatusRefineError,
  xStatusRefineUrl
} from '@/lib/integrations/schemas/twitter';
import { userSchema } from '@/schemas/user';
import { ApplicationError } from '../errors';
import { toJsonObject } from '../json';
import {
  providerTypeSchema,
  PROVIDER_REQUIRED_SCOPES
} from '../integrations/schemas/providers';

export const baseTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

export const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('BONUS_TASK')
});

export type BonusTaskSchema = z.infer<typeof bonusTaskSchema>;

export const bonusTimedTaskSchema = bonusTaskSchema.extend({
  type: z.literal('BONUS_TIMED'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // a special field used to render custom validator messages
  validator: z.any().optional()
});

export type BonusTimedTaskSchema = z.infer<typeof bonusTimedTaskSchema>;

export const bonusLimitedTaskSchema = bonusTaskSchema.extend({
  type: z.literal('BONUS_LIMITED'),
  maxEntrants: z.number().min(1, 'Limit must be at least 1')
});

export type BonusLimitedTaskSchema = z.infer<typeof bonusLimitedTaskSchema>;

export const MAX_ALLOWED_LOYALTY_TIERS = 5;
export const bonusLoyaltyTaskSchema = bonusTaskSchema.extend({
  type: z.literal('BONUS_LOYALTY'),
  loyaltyRequired: z.number().min(1, 'Must be at least 1')
});

export type BonusLoyaltyTaskSchema = z.infer<typeof bonusLoyaltyTaskSchema>;

export const visitUrlTaskSchema = baseTaskSchema.extend({
  type: z.literal('VISIT_URL'),
  href: z.string().url(),
  label: z.string().min(3, 'Label is required')
});

export type VisitUrlTaskSchema = z.infer<typeof visitUrlTaskSchema>;

export const twitterConnectTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_CONNECT')
});

export type TwitterConnectTaskSchema = z.infer<typeof twitterConnectTaskSchema>;

export const twitterFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_FOLLOW'),
  username: z
    .string()
    .url('Profile URL is required')
    .refine((val) => {
      const urlPattern = /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,15}$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://x.com/username')
});

export type TwitterFollowTaskSchema = z.infer<typeof twitterFollowTaskSchema>;

export const twitterRetweetTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_RETWEET'),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError),
  validateEntries: z.boolean().optional()
});

export type TwitterRetweetTaskSchema = z.infer<typeof twitterRetweetTaskSchema>;

export const twitterLikeTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_LIKE'),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError),
  validateEntries: z.boolean().optional()
});

export type TwitterLikeTaskSchema = z.infer<typeof twitterLikeTaskSchema>;

export const steamWishlistTaskSchema = baseTaskSchema.extend({
  type: z.literal('STEAM_WISHLIST'),
  appId: z
    .string()
    .url('Steam App URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/store\.steampowered\.com\/app\/\d+\/[A-Za-z0-9_\-]+\/?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://store.steampowered.com/app/APP_ID/app_name/')
});

export type SteamWishlistTaskSchema = z.infer<typeof steamWishlistTaskSchema>;

export const discordJoinTaskSchema = baseTaskSchema.extend({
  type: z.literal('DISCORD_JOIN'),
  invite: z
    .string()
    .url('Discord Invite Link is required')
    .refine((val) => {
      const urlPattern =
        /^(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[A-Za-z0-9]+$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://discord.gg/inviteCode'),
  channel: z
    .string()
    .url('Public Channel URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/(www\.)?discord\.com\/channels\/\d+\/\d+$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://discord.com/channels/guildId/channelId')
});

export type DiscordJoinTaskSchema = z.infer<typeof discordJoinTaskSchema>;

export const twitchFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITCH_FOLLOW'),
  channel: z
    .string()
    .url('Twitch Channel URL is required')
    .refine((val) => {
      const urlPattern = /^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]{4,25}$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.twitch.tv/username')
});

export type TwitchFollowTaskSchema = z.infer<typeof twitchFollowTaskSchema>;

export const kickFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('KICK_FOLLOW'),
  channel: z
    .string()
    .url('Kick Channel URL is required')
    .refine((val) => {
      const urlPattern = /^https?:\/\/(www\.)?kick\.com\/[A-Za-z0-9_]{4,25}$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.kick.com/username')
});

export type KickFollowTaskSchema = z.infer<typeof kickFollowTaskSchema>;

export const secretCodeTaskSchema = baseTaskSchema.extend({
  type: z.literal('SECRET_CODE'),
  code: z.string().min(1, 'Secret code is required'),
  hint: z.string().optional()
});

export type SecretCodeTaskSchema = z.infer<typeof secretCodeTaskSchema>;

export const youtubeVisitTaskSchema = baseTaskSchema.extend({
  type: z.literal('YOUTUBE_VISIT'),
  channelName: z.string().optional(),
  subConfirmation: z.boolean().optional(),
  channelUrl: z
    .string()
    .url('YouTube Channel URL is required')
    .refine((val) => {
      // support either: https://www.youtube.com/@gonryun
      // or https://www.youtube.com/channel/UCbTcSd0aoM0A0sxxz8TBD6w
      // or situations where ?sub_confirmation=1 is appended
      const urlPattern =
        /^https?:\/\/(www\.)?youtube\.com\/(channel\/[A-Za-z0-9_\-]+|@[\w\-]+)(\?sub_confirmation=1)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.youtube.com/@username or https://www.youtube.com/channel/CHANNEL_ID')
});

export type YoutubeVisitTaskSchema = z.infer<typeof youtubeVisitTaskSchema>;

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  bonusTimedTaskSchema,
  bonusLimitedTaskSchema,
  bonusLoyaltyTaskSchema,
  visitUrlTaskSchema,
  twitterConnectTaskSchema,
  twitterFollowTaskSchema,
  twitterRetweetTaskSchema,
  twitterLikeTaskSchema,
  steamWishlistTaskSchema,
  discordJoinTaskSchema,
  twitchFollowTaskSchema,
  kickFollowTaskSchema,
  secretCodeTaskSchema,
  youtubeVisitTaskSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_LABEL: Record<TaskType, string> = {
  BONUS_TASK: 'Bonus',
  BONUS_TIMED: 'Timed Bonus',
  BONUS_LIMITED: 'Limited Bonus',
  BONUS_LOYALTY: 'Loyalty Bonus',
  VISIT_URL: 'Visit URL',
  TWITTER_CONNECT: 'Connect X',
  TWITTER_FOLLOW: 'Follow on X',
  TWITTER_RETWEET: 'Repost on X',
  TWITTER_LIKE: 'Like a post on X',
  STEAM_WISHLIST: 'Steam Wishlist',
  DISCORD_JOIN: 'Join Discord Server',
  TWITCH_FOLLOW: 'Follow on Twitch',
  YOUTUBE_VISIT: 'Visit YouTube Channel',
  KICK_FOLLOW: 'Follow on Kick',
  SECRET_CODE: 'Enter Secret Code'
};

export const TASK_INPUT_SCHEMA = {
  BONUS_TASK: z.object({}),
  BONUS_TIMED: z.object({}),
  BONUS_LIMITED: z.object({}),
  VISIT_URL: z.object({}),
  TWITTER_CONNECT: z.object({}),
  TWITTER_FOLLOW: z.object({}),
  TWITTER_RETWEET: z.object({}),
  TWITTER_LIKE: z.object({}),
  STEAM_WISHLIST: z.object({}),
  DISCORD_JOIN: z.object({}),
  TWITCH_FOLLOW: z.object({}),
  KICK_FOLLOW: z.object({}),
  YOUTUBE_VISIT: z.object({}),
  BONUS_LOYALTY: z.object({}),
  SECRET_CODE: z.object({
    code: z.string().min(1, 'Secret code is required')
  })
} as const satisfies Record<TaskType, z.ZodTypeAny>;

export type TaskInput<T extends TaskSchema> = T extends { type: infer U }
  ? U extends TaskType
    ? z.infer<(typeof TASK_INPUT_SCHEMA)[U]>
    : never
  : never;

export type TaskSchema = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<TaskSchema, { type: T }>;

export const taskPlatformSchema = providerTypeSchema
  .or(z.literal('website'))
  .or(z.literal('bonus'));

export type TaskPlatformSchema = z.infer<typeof taskPlatformSchema>;

export const TASK_PLATFORM: Record<TaskType, TaskPlatformSchema> = {
  BONUS_TASK: 'bonus',
  BONUS_TIMED: 'bonus',
  BONUS_LIMITED: 'bonus',
  BONUS_LOYALTY: 'bonus',
  SECRET_CODE: 'bonus',
  VISIT_URL: 'website',
  TWITTER_CONNECT: 'twitter',
  TWITTER_FOLLOW: 'twitter',
  TWITTER_RETWEET: 'twitter',
  TWITTER_LIKE: 'twitter',
  STEAM_WISHLIST: 'steam',
  YOUTUBE_VISIT: 'youtube',
  DISCORD_JOIN: 'discord',
  TWITCH_FOLLOW: 'twitch',
  KICK_FOLLOW: 'kick'
};

export const TASK_REQUIRED_SCOPES: Record<TaskPlatformSchema, string[]> = {
  ...PROVIDER_REQUIRED_SCOPES,
  website: [],
  bonus: []
};

export const TASK_PLATFORM_LABEL: Record<TaskPlatformSchema, string> = {
  website: 'Website',
  bonus: 'Bonus',
  twitter: 'X (Twitter)',
  steam: 'Steam',
  discord: 'Discord',
  google: 'Google',
  email: 'Email',
  twitch: 'Twitch',
  kick: 'Kick',
  youtube: 'YouTube'
};

export const taskCategorySchema = z.enum(['social', 'engagement', 'community']);

export type TaskCategorySchema = z.infer<typeof taskCategorySchema>;

export const TASK_CATEGORY: Record<TaskType, TaskCategorySchema> = {
  BONUS_TASK: 'engagement',
  BONUS_TIMED: 'engagement',
  BONUS_LIMITED: 'engagement',
  BONUS_LOYALTY: 'engagement',
  VISIT_URL: 'engagement',
  SECRET_CODE: 'engagement',
  TWITTER_CONNECT: 'social',
  TWITTER_FOLLOW: 'social',
  TWITTER_RETWEET: 'social',
  TWITTER_LIKE: 'social',
  DISCORD_JOIN: 'social',
  STEAM_WISHLIST: 'community',
  TWITCH_FOLLOW: 'social',
  KICK_FOLLOW: 'social',
  YOUTUBE_VISIT: 'social'
};
export const TASK_CATEGORY_LABEL: Record<TaskCategorySchema, string> = {
  social: 'Social',
  engagement: 'Engagement',
  community: 'Community'
};

export const TASK_IS_IMPORT: Record<TaskType, boolean> = {
  BONUS_TASK: false,
  BONUS_TIMED: false,
  BONUS_LIMITED: false,
  BONUS_LOYALTY: false,
  VISIT_URL: false,
  SECRET_CODE: false,
  TWITTER_CONNECT: false,
  TWITTER_FOLLOW: false,
  TWITTER_RETWEET: false,
  TWITTER_LIKE: false,
  DISCORD_JOIN: false,
  STEAM_WISHLIST: false,
  TWITCH_FOLLOW: false,
  KICK_FOLLOW: false,
  YOUTUBE_VISIT: false
};

export const userEntriesSchema = z.object({
  id: z.string(),
  user: userSchema,
  task: taskSchema,
  status: z.nativeEnum(CompletionStatus),
  proof: z.unknown(),
  completedAt: z.number()
});

export type UserEntriesSchema = z.infer<typeof userEntriesSchema>;

export const toTaskSchema = (stored: Task): TaskSchema => {
  const json = toJsonObject(stored.config);
  const parsed = taskSchema.safeParse({
    ...json,
    id: stored.id
  });
  if (parsed.success) {
    return parsed.data;
  } else {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config',
      cause: parsed.error
    });
  }
};
