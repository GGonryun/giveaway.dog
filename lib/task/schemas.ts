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
    .refine(xStatusRefineUrl, xStatusRefineError)
});

export type TwitterRetweetTaskSchema = z.infer<typeof twitterRetweetTaskSchema>;

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

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  visitUrlTaskSchema,
  twitterConnectTaskSchema,
  twitterFollowTaskSchema,
  twitterRetweetTaskSchema,
  steamWishlistTaskSchema,
  discordJoinTaskSchema,
  twitchFollowTaskSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_LABEL: Record<TaskType, string> = {
  BONUS_TASK: 'Bonus',
  VISIT_URL: 'Visit URL',
  TWITTER_CONNECT: 'Connect X',
  TWITTER_FOLLOW: 'Follow on X',
  TWITTER_RETWEET: 'Repost on X',
  STEAM_WISHLIST: 'Steam Wishlist',
  DISCORD_JOIN: 'Join Discord Server',
  TWITCH_FOLLOW: 'Follow on Twitch'
};

export type TaskSchema = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<TaskSchema, { type: T }>;

export const taskPlatformSchema = providerTypeSchema.or(z.literal('website'));

export type TaskPlatformSchema = z.infer<typeof taskPlatformSchema>;

export const TASK_PLATFORM: Record<TaskType, TaskPlatformSchema> = {
  BONUS_TASK: 'website',
  VISIT_URL: 'website',
  TWITTER_CONNECT: 'twitter',
  TWITTER_FOLLOW: 'twitter',
  TWITTER_RETWEET: 'twitter',
  STEAM_WISHLIST: 'steam',
  DISCORD_JOIN: 'discord',
  TWITCH_FOLLOW: 'twitch'
};

export const TASK_REQUIRED_SCOPES: Record<TaskPlatformSchema, string[]> = {
  ...PROVIDER_REQUIRED_SCOPES,
  website: []
};

export const TASK_PLATFORM_LABEL: Record<TaskPlatformSchema, string> = {
  website: 'Website',
  twitter: 'X (Twitter)',
  steam: 'Steam',
  discord: 'Discord',
  google: 'Google',
  email: 'Email',
  twitch: 'Twitch'
};

export const taskCategorySchema = z.enum(['social', 'engagement', 'community']);

export type TaskCategorySchema = z.infer<typeof taskCategorySchema>;

export const TASK_CATEGORY: Record<TaskType, TaskCategorySchema> = {
  BONUS_TASK: 'engagement',
  VISIT_URL: 'engagement',
  TWITTER_CONNECT: 'social',
  TWITTER_FOLLOW: 'social',
  TWITTER_RETWEET: 'social',
  DISCORD_JOIN: 'social',
  STEAM_WISHLIST: 'community',
  TWITCH_FOLLOW: 'social'
};
export const TASK_CATEGORY_LABEL: Record<TaskCategorySchema, string> = {
  social: 'Social',
  engagement: 'Engagement',
  community: 'Community'
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
