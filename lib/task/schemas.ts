import z from 'zod';

import { CompletionStatus, IdentityProvider, Task } from '@prisma/client';
import {
  xProfileRefineError,
  xProfileRefineUrl,
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
import {
  blueskyPostRefineError,
  blueskyPostRefineUrl,
  blueskyProfileRefineError,
  blueskyProfileRefineUrl
} from '../integrations/schemas/bluesky-helpers';

export const baseTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

export const afterVisitSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DELAY'),
    seconds: z
      .number()
      .min(1, 'Seconds must be at least 1')
      .max(300, 'Seconds cannot exceed 300')
  }),
  z.object({
    type: z.literal('QUESTION'),
    question: z.string().min(1, 'Question is required'),
    input: z.enum(['TEXT'])
  }),
  z.object({
    type: z.literal('INSTANT')
  })
]);

export type AfterVisitSchema = z.infer<typeof afterVisitSchema>;

export const validationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('NONE')
  }),
  z.object({
    type: z.literal('STRICT')
  })
]);

export const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('BONUS_TASK')
});

export type BonusTaskSchema = z.infer<typeof bonusTaskSchema>;

export const bonusTimedTaskSchema = bonusTaskSchema.extend({
  type: z.literal('BONUS_TIMED'),
  startDate: z.string().nullish(),
  endDate: z.string().nullish()
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

export const bonusCompleteProfileTaskSchema = bonusTaskSchema.extend({
  type: z.literal('BONUS_COMPLETE_PROFILE')
});

export type BonusCompleteProfileTaskSchema = z.infer<
  typeof bonusCompleteProfileTaskSchema
>;
export const visitUrlTaskSchema = baseTaskSchema.extend({
  type: z.literal('VISIT_URL'),
  href: z.string().url(),
  label: z.string().min(3, 'Label is required'),
  afterVisit: afterVisitSchema.optional()
});

export type VisitUrlTaskSchema = z.infer<typeof visitUrlTaskSchema>;

export const askQuestionTaskSchema = baseTaskSchema.extend({
  type: z.literal('ASK_QUESTION'),
  question: z.string().min(1, 'Question is required'),
  placeholder: z.string().optional(),
  instructions: z.string().optional()
});

export type AskQuestionTaskSchema = z.infer<typeof askQuestionTaskSchema>;

export const singleChoiceTaskSchema = baseTaskSchema.extend({
  type: z.literal('SINGLE_CHOICE'),
  question: z.string().min(1, 'Question is required'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'At least two options are required')
});

export type SingleChoiceTaskSchema = z.infer<typeof singleChoiceTaskSchema>;

export const multipleChoiceTaskSchema = baseTaskSchema.extend({
  type: z.literal('MULTIPLE_CHOICE'),
  question: z.string().min(1, 'Question is required'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'At least two options are required'),
  minSelections: z
    .number()
    .min(1, 'Minimum selections must be at least 1')
    .optional(),
  maxSelections: z
    .number()
    .min(1, 'Maximum selections must be at least 1')
    .optional()
});

export type MultipleChoiceTaskSchema = z.infer<typeof multipleChoiceTaskSchema>;

export const twitterConnectTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_CONNECT')
});

export type TwitterConnectTaskSchema = z.infer<typeof twitterConnectTaskSchema>;

export const twitterFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_FOLLOW'),
  validation: validationSchema.default({ type: 'STRICT' }).optional(),
  username: z
    .string()
    .url('Profile URL is required')
    .refine(xProfileRefineUrl, xProfileRefineError)
});

export type TwitterFollowTaskSchema = z.infer<typeof twitterFollowTaskSchema>;

export const twitterRetweetTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_RETWEET'),
  validation: validationSchema.default({ type: 'STRICT' }).optional(),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError)
});

export type TwitterRetweetTaskSchema = z.infer<typeof twitterRetweetTaskSchema>;

export const twitterRetweetImportTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_RETWEET_IMPORT'),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError),
  importingAccount: z.string().min(1, 'Importing account is required'),
  verifiedBonus: z
    .number()
    .min(1, 'Verified bonus must be at least 1')
    .nullish()
});

export type TwitterRetweetImportTaskSchema = z.infer<
  typeof twitterRetweetImportTaskSchema
>;

export const twitterLikeTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_LIKE'),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError)
});

export type TwitterLikeTaskSchema = z.infer<typeof twitterLikeTaskSchema>;

export const twitterLikeImportTaskSchema = baseTaskSchema.extend({
  type: z.literal('TWITTER_LIKE_IMPORT'),
  tweetId: z
    .string()
    .url('Post URL is required')
    .refine(xStatusRefineUrl, xStatusRefineError),
  importingAccount: z.string().min(1, 'Importing account is required'),
  verifiedBonus: z
    .number()
    .min(1, 'Verified bonus must be at least 1')
    .nullish()
});

export type TwitterLikeImportTaskSchema = z.infer<
  typeof twitterLikeImportTaskSchema
>;

export const steamWishlistTaskSchema = baseTaskSchema.extend({
  type: z.literal('STEAM_WISHLIST'),
  appId: z
    .string()
    .url('Steam App URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/store\.steampowered\.com\/app\/\d+(?:\/[A-Za-z0-9_\-]+)?(?:\/)?(?:\?.*)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://store.steampowered.com/app/APP_ID or https://store.steampowered.com/app/APP_ID/app_name')
});

export type SteamWishlistTaskSchema = z.infer<typeof steamWishlistTaskSchema>;

export const steamFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('STEAM_FOLLOW'),
  developer: z
    .string()
    .url('Steam Developer/Publisher URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/store\.steampowered\.com\/(developer|publisher|curator)\/[A-Za-z0-9_\-]+(?:\/)?(?:\?.*)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://store.steampowered.com/developer/DeveloperName or https://store.steampowered.com/publisher/PublisherName'),
  requireProof: z.boolean().default(false),
  validation: validationSchema.default({ type: 'STRICT' }).optional()
});

export type SteamFollowTaskSchema = z.infer<typeof steamFollowTaskSchema>;

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
        /^https?:\/\/(www\.)?(discord\.com|discordapp\.com)\/channels\/\d+\/\d+$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://discord.com/channels/guildId/channelId or https://discordapp.com/channels/guildId/channelId')
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
  caseSensitive: z.boolean().nullish().default(false),
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
      // or https://www.youtube.com/KensonPlays (username without @)
      // or situations where ?sub_confirmation=1 is appended
      const urlPattern =
        /^https?:\/\/(www\.)?youtube\.com\/(channel\/[A-Za-z0-9_\-]+|@[\w\-]+|[A-Za-z0-9_\-]+)(\?sub_confirmation=1)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.youtube.com/@username, https://www.youtube.com/username, or https://www.youtube.com/channel/CHANNEL_ID')
});

export type YoutubeVisitTaskSchema = z.infer<typeof youtubeVisitTaskSchema>;

export const instagramVisitTaskSchema = baseTaskSchema.extend({
  type: z.literal('INSTAGRAM_VISIT'),
  profileUrl: z
    .string()
    .url('Instagram Profile URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]{1,30}\/?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.instagram.com/username/')
});

export type InstagramVisitTaskSchema = z.infer<typeof instagramVisitTaskSchema>;

const instagramPostRefine = () =>
  z
    .string()
    .url('Instagram Post URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/(www\.)?instagram\.com\/(([A-Za-z0-9_.]+)\/)?p\/[A-Za-z0-9_-]+(\/)?(\?.*)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.instagram.com/p/POST_ID/ or https://www.instagram.com/username/p/POST_ID/');

export const instagramLikeTaskSchema = baseTaskSchema.extend({
  type: z.literal('INSTAGRAM_LIKE'),
  postUrl: instagramPostRefine()
});

export type InstagramLikeTaskSchema = z.infer<typeof instagramLikeTaskSchema>;

export const instagramCommentTaskSchema = baseTaskSchema.extend({
  type: z.literal('INSTAGRAM_COMMENT'),
  postUrl: instagramPostRefine()
});

export type InstagramCommentTaskSchema = z.infer<
  typeof instagramCommentTaskSchema
>;

export const facebookVisitPageTaskSchema = baseTaskSchema.extend({
  type: z.literal('FACEBOOK_VISIT_PAGE'),
  afterVisit: afterVisitSchema,
  pageUrl: z
    .string()
    .url('Facebook Page URL is required or missing https://')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/(www\.)?facebook\.com\/(profile\.php\?id=\d+|people\/[A-Za-z0-9_.\-]+\/\d+|share\/[A-Za-z0-9]+|\d+|[A-Za-z0-9_.]+)(\/)?(\?.*)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.facebook.com/yourpagename or https://www.facebook.com/profile.php?id=PAGE_ID or https://www.facebook.com/share/SHARE_ID')
});

export type FacebookVisitPageTaskSchema = z.infer<
  typeof facebookVisitPageTaskSchema
>;

export const facebookViewPostTaskSchema = baseTaskSchema.extend({
  type: z.literal('FACEBOOK_VIEW_POST'),
  postUrl: z
    .string()
    .url('Facebook Post URL is required')
    .refine((val) => {
      // Support multiple Facebook post URL formats:
      // 1. https://www.facebook.com/permalink.php?story_fbid=pfbid0rb57os1TLNQSUHKiKuLQLWYtYxMhiBZ2xXXs3c8whHjXwoddiiDfaNwk5ASEeNgwl&id=61584646297782
      // 2. https://www.facebook.com/pagename/posts/123456789
      // 3. https://www.facebook.com/photo.php?fbid=123456789&id=987654321
      const permalinkPattern =
        /^https?:\/\/(www\.)?facebook\.com\/permalink\.php\?story_fbid=[A-Za-z0-9]+(&|&amp;)id=\d+/;
      const postsPattern =
        /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.\-]+\/posts\/[A-Za-z0-9]+\/?$/;
      const photoPattern =
        /^https?:\/\/(www\.)?facebook\.com\/photo\.php\?fbid=\d+(&|&amp;)id=\d+/;

      return (
        permalinkPattern.test(val) ||
        postsPattern.test(val) ||
        photoPattern.test(val)
      );
    }, 'Unexpected URL format. Please provide a valid Facebook post URL')
});

export type FacebookViewPostTaskSchema = z.infer<
  typeof facebookViewPostTaskSchema
>;

export const tiktokFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('TIKTOK_FOLLOW'),
  validation: validationSchema.default({ type: 'STRICT' }).optional(),
  profileUrl: z
    .string()
    .url('TikTok Profile URL is required')
    .refine((val) => {
      const urlPattern =
        /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]{1,30}\/?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.tiktok.com/@username/')
});

export type TiktokFollowTaskSchema = z.infer<typeof tiktokFollowTaskSchema>;

export const tiktokLikeTaskSchema = baseTaskSchema.extend({
  type: z.literal('TIKTOK_LIKE'),
  validation: validationSchema.default({ type: 'STRICT' }).optional(),
  postUrl: z
    .string()
    .url('TikTok Post URL is required')
    .refine((val) => {
      // shape of https://www.tiktok.com/@username/video/1234567890 or https://www.tiktok.com/@username/photo/1234567890
      const urlPattern =
        /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]{1,30}\/(video|photo)\/[0-9]+(\/)?(\?.*)?$/;
      return urlPattern.test(val);
    }, 'Unexpected URL, should be like https://www.tiktok.com/@username/video/1234567890/ or https://www.tiktok.com/@username/photo/1234567890/')
});

export type TiktokLikeTaskSchema = z.infer<typeof tiktokLikeTaskSchema>;

export const blueskyConnectTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_CONNECT')
});

export type BlueskyConnectTaskSchema = z.infer<typeof blueskyConnectTaskSchema>;

export const blueskyFollowTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_FOLLOW'),
  profileUrl: z
    .string()
    .min(1, 'Bluesky profile URL or handle is required')
    .refine((val) => {
      // Accept either profile URL or handle format
      return blueskyProfileRefineUrl(val);
    }, blueskyProfileRefineError)
});

export type BlueskyFollowTaskSchema = z.infer<typeof blueskyFollowTaskSchema>;

export const blueskyLikeTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_LIKE'),
  postUrl: z
    .string()
    .url('Bluesky Post URL is required')
    .refine((val) => {
      return blueskyPostRefineUrl(val);
    }, blueskyPostRefineError)
});

export type BlueskyLikeTaskSchema = z.infer<typeof blueskyLikeTaskSchema>;

export const blueskyRepostTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_REPOST'),
  postUrl: z
    .string()
    .url('Bluesky Post URL is required')
    .refine((val) => {
      return blueskyPostRefineUrl(val);
    }, blueskyPostRefineError)
});

export type BlueskyRepostTaskSchema = z.infer<typeof blueskyRepostTaskSchema>;

export const blueskyLikeImportTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_LIKE_IMPORT'),
  postUrl: z
    .string()
    .url('Bluesky Post URL is required')
    .refine((val) => {
      return blueskyPostRefineUrl(val);
    }, blueskyPostRefineError),
  importingAccount: z.string().min(1, 'Importing account is required')
});

export type BlueskyLikeImportTaskSchema = z.infer<
  typeof blueskyLikeImportTaskSchema
>;

export const blueskyRepostImportTaskSchema = baseTaskSchema.extend({
  type: z.literal('BLUESKY_REPOST_IMPORT'),
  postUrl: z
    .string()
    .url('Bluesky Post URL is required')
    .refine((val) => {
      return blueskyPostRefineUrl(val);
    }, blueskyPostRefineError),
  importingAccount: z.string().min(1, 'Importing account is required')
});

export type BlueskyRepostImportTaskSchema = z.infer<
  typeof blueskyRepostImportTaskSchema
>;

export const referralLinkTaskSchema = baseTaskSchema.extend({
  type: z.literal('REFERRAL_LINK'),
  maximum: z.number().min(1, 'Maximum referrals must be at least 1').nullish()
});

export type ReferralLinkTaskSchema = z.infer<typeof referralLinkTaskSchema>;

export const submitMediaTaskSchema = baseTaskSchema.extend({
  type: z.literal('SUBMIT_MEDIA'),
  description: z.string().default('Submit the required media as proof.'),
  acceptedTypes: z
    .array(
      z.nativeEnum({
        IMAGE: 'IMAGE'
      } as const)
    )
    .min(1, 'At least one media type is required')
});

export type SubmitMediaTaskSchema = z.infer<typeof submitMediaTaskSchema>;

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  bonusTimedTaskSchema,
  bonusLimitedTaskSchema,
  bonusLoyaltyTaskSchema,
  bonusCompleteProfileTaskSchema,
  visitUrlTaskSchema,
  askQuestionTaskSchema,
  singleChoiceTaskSchema,
  multipleChoiceTaskSchema,
  submitMediaTaskSchema,
  twitterConnectTaskSchema,
  twitterFollowTaskSchema,
  twitterRetweetTaskSchema,
  twitterRetweetImportTaskSchema,
  twitterLikeTaskSchema,
  twitterLikeImportTaskSchema,
  steamWishlistTaskSchema,
  steamFollowTaskSchema,
  discordJoinTaskSchema,
  twitchFollowTaskSchema,
  kickFollowTaskSchema,
  secretCodeTaskSchema,
  youtubeVisitTaskSchema,
  instagramVisitTaskSchema,
  instagramLikeTaskSchema,
  instagramCommentTaskSchema,
  facebookVisitPageTaskSchema,
  facebookViewPostTaskSchema,
  tiktokFollowTaskSchema,
  tiktokLikeTaskSchema,
  blueskyConnectTaskSchema,
  blueskyFollowTaskSchema,
  blueskyLikeTaskSchema,
  blueskyRepostTaskSchema,
  blueskyLikeImportTaskSchema,
  blueskyRepostImportTaskSchema,
  referralLinkTaskSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_LABEL: Record<TaskType, string> = {
  REFERRAL_LINK: 'Refer a Friend',
  BONUS_TASK: 'Bonus',
  BONUS_TIMED: 'Timed Bonus',
  BONUS_LIMITED: 'Limited Bonus',
  BONUS_LOYALTY: 'Loyalty Bonus',
  BONUS_COMPLETE_PROFILE: 'Complete Your Profile',
  VISIT_URL: 'Visit URL',
  ASK_QUESTION: 'Ask a Question',
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_CHOICE: 'Multiple Choice',
  SUBMIT_MEDIA: 'Submit Media',
  SECRET_CODE: 'Enter Secret Code',
  TWITTER_CONNECT: 'Connect X',
  TWITTER_FOLLOW: 'Follow on X',
  TWITTER_RETWEET: 'Repost on X',
  TWITTER_RETWEET_IMPORT: 'Repost on X',
  TWITTER_LIKE: 'Like a post on X',
  TWITTER_LIKE_IMPORT: 'Like a post on X',
  STEAM_WISHLIST: 'Steam Wishlist',
  STEAM_FOLLOW: 'Follow on Steam',
  DISCORD_JOIN: 'Join Discord Server',
  TWITCH_FOLLOW: 'Follow on Twitch',
  YOUTUBE_VISIT: 'Visit YouTube Channel',
  KICK_FOLLOW: 'Follow on Kick',
  INSTAGRAM_VISIT: 'Visit Instagram Profile',
  INSTAGRAM_LIKE: 'Like Instagram Post',
  INSTAGRAM_COMMENT: 'Comment on Instagram Post',
  FACEBOOK_VISIT_PAGE: 'Visit Facebook Page',
  FACEBOOK_VIEW_POST: 'View Facebook Post',
  TIKTOK_FOLLOW: 'Follow on TikTok',
  TIKTOK_LIKE: 'Like TikTok Post',
  BLUESKY_CONNECT: 'Connect Bluesky',
  BLUESKY_FOLLOW: 'Follow on Bluesky',
  BLUESKY_LIKE: 'Like a post on Bluesky',
  BLUESKY_REPOST: 'Repost on Bluesky',
  BLUESKY_LIKE_IMPORT: 'Like a post on Bluesky',
  BLUESKY_REPOST_IMPORT: 'Repost on Bluesky'
};

export const TASK_INPUT_SCHEMA = {
  BONUS_TASK: z.object({}),
  BONUS_TIMED: z.object({}),
  BONUS_LIMITED: z.object({}),
  BONUS_LOYALTY: z.object({}),
  BONUS_COMPLETE_PROFILE: z.object({}),
  VISIT_URL: z.object({
    answer: z.optional(z.string())
  }),
  TWITTER_CONNECT: z.object({}),
  TWITTER_FOLLOW: z.object({}),
  TWITTER_RETWEET: z.object({}),
  TWITTER_RETWEET_IMPORT: z.object({}),
  TWITTER_LIKE: z.object({}),
  TWITTER_LIKE_IMPORT: z.object({}),
  STEAM_WISHLIST: z.object({}),
  STEAM_FOLLOW: z.object({
    mediaUrl: z.optional(z.string().url('Media URL is required'))
  }),
  DISCORD_JOIN: z.object({}),
  TWITCH_FOLLOW: z.object({}),
  KICK_FOLLOW: z.object({}),
  YOUTUBE_VISIT: z.object({}),
  INSTAGRAM_VISIT: z.object({}),
  INSTAGRAM_LIKE: z.object({}),
  INSTAGRAM_COMMENT: z.object({}),
  FACEBOOK_VISIT_PAGE: z.object({}),
  FACEBOOK_VIEW_POST: z.object({}),
  TIKTOK_FOLLOW: z.object({}),
  TIKTOK_LIKE: z.object({}),
  SECRET_CODE: z.object({
    code: z.string().min(1, 'Secret code is required')
  }),
  ASK_QUESTION: z.object({
    answer: z.string().min(1, 'Answer is required')
  }),
  SINGLE_CHOICE: z.object({
    choice: z.string().min(1, 'Please select an option')
  }),
  MULTIPLE_CHOICE: z.object({
    choices: z.array(z.string()).min(1, 'Please select at least one option')
  }),
  SUBMIT_MEDIA: z.object({
    mediaUrl: z.string().url('Media URL is required')
  }),
  BLUESKY_CONNECT: z.object({}),
  BLUESKY_FOLLOW: z.object({}),
  BLUESKY_LIKE: z.object({}),
  BLUESKY_REPOST: z.object({}),
  BLUESKY_LIKE_IMPORT: z.object({}),
  BLUESKY_REPOST_IMPORT: z.object({}),
  REFERRAL_LINK: z.object({})
} as const satisfies Record<TaskType, z.ZodTypeAny>;

export const TASK_JOB_DATA_SCHEMA = {
  BONUS_TASK: z.object({}),
  BONUS_TIMED: z.object({}),
  BONUS_LIMITED: z.object({}),
  BONUS_LOYALTY: z.object({}),
  BONUS_COMPLETE_PROFILE: z.object({}),
  VISIT_URL: z.object({}),
  TWITTER_CONNECT: z.object({}),
  TWITTER_FOLLOW: z.object({}),
  TWITTER_RETWEET: z.object({}),
  TWITTER_RETWEET_IMPORT: z.object({
    runs: z.number().min(0),
    lastProcessedId: z.string().optional()
  }),
  TWITTER_LIKE: z.object({}),
  TWITTER_LIKE_IMPORT: z.object({
    runs: z.number().min(0),
    lastProcessedId: z.string().optional()
  }),
  STEAM_WISHLIST: z.object({}),
  STEAM_FOLLOW: z.object({}),
  DISCORD_JOIN: z.object({}),
  TWITCH_FOLLOW: z.object({}),
  KICK_FOLLOW: z.object({}),
  YOUTUBE_VISIT: z.object({}),
  INSTAGRAM_VISIT: z.object({}),
  INSTAGRAM_LIKE: z.object({}),
  INSTAGRAM_COMMENT: z.object({}),
  FACEBOOK_VISIT_PAGE: z.object({}),
  FACEBOOK_VIEW_POST: z.object({}),
  TIKTOK_FOLLOW: z.object({}),
  TIKTOK_LIKE: z.object({}),
  SECRET_CODE: z.object({}),
  ASK_QUESTION: z.object({}),
  SINGLE_CHOICE: z.object({}),
  MULTIPLE_CHOICE: z.object({}),
  BLUESKY_CONNECT: z.object({}),
  BLUESKY_FOLLOW: z.object({}),
  BLUESKY_LIKE: z.object({}),
  BLUESKY_REPOST: z.object({}),
  BLUESKY_LIKE_IMPORT: z.object({
    runs: z.number().min(0),
    lastProcessedDid: z.string().optional()
  }),
  BLUESKY_REPOST_IMPORT: z.object({
    runs: z.number().min(0),
    lastProcessedDid: z.string().optional()
  }),
  REFERRAL_LINK: z.object({}),
  SUBMIT_MEDIA: z.object({})
} as const satisfies Record<TaskType, z.ZodTypeAny>;

export type TaskInput<T extends TaskSchema> = T extends { type: infer U }
  ? U extends TaskType
    ? z.infer<(typeof TASK_INPUT_SCHEMA)[U]>
    : never
  : never;

export type TaskSchema = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<TaskSchema, { type: T }>;

export const taskPlatformSchema = providerTypeSchema
  .or(z.literal('WEBSITE'))
  .or(z.literal('BONUS'))
  .or(z.literal('QUESTION'));

export type TaskPlatformSchema = z.infer<typeof taskPlatformSchema>;

export const TASK_PLATFORM: Record<TaskType, TaskPlatformSchema> = {
  BONUS_TASK: 'BONUS',
  BONUS_TIMED: 'BONUS',
  BONUS_LIMITED: 'BONUS',
  BONUS_LOYALTY: 'BONUS',
  BONUS_COMPLETE_PROFILE: 'BONUS',
  SECRET_CODE: 'BONUS',
  VISIT_URL: 'WEBSITE',
  TWITTER_CONNECT: 'TWITTER',
  TWITTER_FOLLOW: 'TWITTER',
  TWITTER_RETWEET: 'TWITTER',
  TWITTER_RETWEET_IMPORT: 'TWITTER',
  TWITTER_LIKE: 'TWITTER',
  TWITTER_LIKE_IMPORT: 'TWITTER',
  STEAM_WISHLIST: 'STEAM',
  STEAM_FOLLOW: 'STEAM',
  YOUTUBE_VISIT: 'YOUTUBE',
  INSTAGRAM_VISIT: 'INSTAGRAM',
  INSTAGRAM_LIKE: 'INSTAGRAM',
  INSTAGRAM_COMMENT: 'INSTAGRAM',
  FACEBOOK_VISIT_PAGE: 'FACEBOOK',
  FACEBOOK_VIEW_POST: 'FACEBOOK',
  TIKTOK_FOLLOW: 'TIKTOK',
  TIKTOK_LIKE: 'TIKTOK',
  DISCORD_JOIN: 'DISCORD',
  TWITCH_FOLLOW: 'TWITCH',
  KICK_FOLLOW: 'KICK',
  ASK_QUESTION: 'QUESTION',
  SINGLE_CHOICE: 'QUESTION',
  MULTIPLE_CHOICE: 'QUESTION',
  BLUESKY_CONNECT: 'BLUESKY',
  BLUESKY_FOLLOW: 'BLUESKY',
  BLUESKY_LIKE: 'BLUESKY',
  BLUESKY_REPOST: 'BLUESKY',
  BLUESKY_LIKE_IMPORT: 'BLUESKY',
  BLUESKY_REPOST_IMPORT: 'BLUESKY',
  REFERRAL_LINK: 'BONUS',
  SUBMIT_MEDIA: 'QUESTION'
};

export const TASK_IDENTITY_PROVIDER: Record<TaskType, IdentityProvider> = {
  BONUS_TASK: 'ANONYMOUS',
  BONUS_TIMED: 'ANONYMOUS',
  BONUS_LIMITED: 'ANONYMOUS',
  BONUS_LOYALTY: 'ANONYMOUS',
  BONUS_COMPLETE_PROFILE: 'ANONYMOUS',
  VISIT_URL: 'ANONYMOUS',
  ASK_QUESTION: 'ANONYMOUS',
  SINGLE_CHOICE: 'ANONYMOUS',
  MULTIPLE_CHOICE: 'ANONYMOUS',
  SECRET_CODE: 'ANONYMOUS',
  TWITTER_CONNECT: 'TWITTER',
  TWITTER_FOLLOW: 'TWITTER',
  TWITTER_RETWEET: 'TWITTER',
  TWITTER_RETWEET_IMPORT: 'TWITTER',
  TWITTER_LIKE: 'TWITTER',
  TWITTER_LIKE_IMPORT: 'TWITTER',
  STEAM_WISHLIST: 'STEAM',
  STEAM_FOLLOW: 'STEAM',
  DISCORD_JOIN: 'DISCORD',
  TWITCH_FOLLOW: 'TWITCH',
  KICK_FOLLOW: 'KICK',
  YOUTUBE_VISIT: 'YOUTUBE',
  INSTAGRAM_VISIT: 'INSTAGRAM',
  INSTAGRAM_LIKE: 'INSTAGRAM',
  INSTAGRAM_COMMENT: 'INSTAGRAM',
  FACEBOOK_VISIT_PAGE: 'FACEBOOK',
  FACEBOOK_VIEW_POST: 'FACEBOOK',
  TIKTOK_FOLLOW: 'TIKTOK',
  TIKTOK_LIKE: 'TIKTOK',
  BLUESKY_CONNECT: 'BLUESKY',
  BLUESKY_FOLLOW: 'BLUESKY',
  BLUESKY_LIKE: 'BLUESKY',
  BLUESKY_REPOST: 'BLUESKY',
  BLUESKY_LIKE_IMPORT: 'BLUESKY',
  BLUESKY_REPOST_IMPORT: 'BLUESKY',
  REFERRAL_LINK: 'ANONYMOUS',
  SUBMIT_MEDIA: 'ANONYMOUS'
};

export const TASK_REQUIRED_SCOPES: Record<TaskPlatformSchema, string[]> = {
  ...PROVIDER_REQUIRED_SCOPES,
  WEBSITE: [],
  BONUS: [],
  QUESTION: []
};

export const TASK_PLATFORM_LABEL: Record<TaskPlatformSchema, string> = {
  WEBSITE: 'Website',
  BONUS: 'Bonus',
  QUESTION: 'Question',
  TWITTER: 'X (Twitter)',
  BLUESKY: 'Bluesky',
  STEAM: 'Steam',
  DISCORD: 'Discord',
  GOOGLE: 'Google',
  EMAIL: 'Email',
  TWITCH: 'Twitch',
  KICK: 'Kick',
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  ANONYMOUS: 'Anonymous'
};

export const taskCategorySchema = z.enum(['social', 'engagement', 'community']);

export type TaskCategorySchema = z.infer<typeof taskCategorySchema>;

export const TASK_CATEGORY: Record<TaskType, TaskCategorySchema> = {
  BONUS_TASK: 'engagement',
  BONUS_TIMED: 'engagement',
  BONUS_LIMITED: 'engagement',
  BONUS_LOYALTY: 'engagement',
  BONUS_COMPLETE_PROFILE: 'engagement',
  VISIT_URL: 'engagement',
  SECRET_CODE: 'engagement',
  TWITTER_CONNECT: 'social',
  TWITTER_FOLLOW: 'social',
  TWITTER_RETWEET: 'social',
  TWITTER_RETWEET_IMPORT: 'social',
  TWITTER_LIKE: 'social',
  TWITTER_LIKE_IMPORT: 'social',
  DISCORD_JOIN: 'social',
  STEAM_WISHLIST: 'community',
  STEAM_FOLLOW: 'community',
  TWITCH_FOLLOW: 'social',
  KICK_FOLLOW: 'social',
  YOUTUBE_VISIT: 'social',
  INSTAGRAM_VISIT: 'social',
  INSTAGRAM_LIKE: 'social',
  INSTAGRAM_COMMENT: 'social',
  FACEBOOK_VISIT_PAGE: 'social',
  FACEBOOK_VIEW_POST: 'social',
  TIKTOK_FOLLOW: 'social',
  TIKTOK_LIKE: 'social',
  ASK_QUESTION: 'engagement',
  SINGLE_CHOICE: 'engagement',
  MULTIPLE_CHOICE: 'engagement',
  BLUESKY_CONNECT: 'social',
  BLUESKY_FOLLOW: 'social',
  BLUESKY_LIKE: 'social',
  BLUESKY_REPOST: 'social',
  BLUESKY_LIKE_IMPORT: 'social',
  BLUESKY_REPOST_IMPORT: 'social',
  REFERRAL_LINK: 'engagement',
  SUBMIT_MEDIA: 'engagement'
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
  BONUS_COMPLETE_PROFILE: false,
  VISIT_URL: false,
  SECRET_CODE: false,
  TWITTER_CONNECT: false,
  TWITTER_FOLLOW: false,
  TWITTER_RETWEET: false,
  TWITTER_RETWEET_IMPORT: true,
  TWITTER_LIKE: false,
  TWITTER_LIKE_IMPORT: true,
  DISCORD_JOIN: false,
  STEAM_WISHLIST: false,
  STEAM_FOLLOW: false,
  TWITCH_FOLLOW: false,
  KICK_FOLLOW: false,
  YOUTUBE_VISIT: false,
  INSTAGRAM_VISIT: false,
  INSTAGRAM_LIKE: false,
  INSTAGRAM_COMMENT: false,
  FACEBOOK_VISIT_PAGE: false,
  FACEBOOK_VIEW_POST: false,
  TIKTOK_FOLLOW: false,
  TIKTOK_LIKE: false,
  ASK_QUESTION: false,
  SINGLE_CHOICE: false,
  MULTIPLE_CHOICE: false,
  BLUESKY_CONNECT: false,
  BLUESKY_FOLLOW: false,
  BLUESKY_LIKE: false,
  BLUESKY_REPOST: false,
  BLUESKY_LIKE_IMPORT: true,
  BLUESKY_REPOST_IMPORT: true,
  REFERRAL_LINK: false,
  SUBMIT_MEDIA: false
};

export const TASK_ALLOW_MANUAL_ADD: Record<TaskType, boolean> = {
  BONUS_TASK: true,
  BONUS_TIMED: true,
  BONUS_LIMITED: true,
  BONUS_LOYALTY: true,
  BONUS_COMPLETE_PROFILE: false,
  VISIT_URL: true,
  SECRET_CODE: true,
  TWITTER_CONNECT: true,
  TWITTER_FOLLOW: true,
  TWITTER_RETWEET: true,
  TWITTER_RETWEET_IMPORT: true,
  TWITTER_LIKE: true,
  TWITTER_LIKE_IMPORT: true,
  DISCORD_JOIN: true,
  STEAM_WISHLIST: true,
  STEAM_FOLLOW: true,
  TWITCH_FOLLOW: true,
  KICK_FOLLOW: true,
  YOUTUBE_VISIT: true,
  INSTAGRAM_VISIT: true,
  INSTAGRAM_LIKE: true,
  INSTAGRAM_COMMENT: true,
  FACEBOOK_VISIT_PAGE: true,
  FACEBOOK_VIEW_POST: true,
  TIKTOK_FOLLOW: true,
  TIKTOK_LIKE: true,
  ASK_QUESTION: true,
  SINGLE_CHOICE: true,
  MULTIPLE_CHOICE: true,
  BLUESKY_CONNECT: true,
  BLUESKY_FOLLOW: true,
  BLUESKY_LIKE: true,
  BLUESKY_REPOST: true,
  BLUESKY_LIKE_IMPORT: true,
  BLUESKY_REPOST_IMPORT: true,
  REFERRAL_LINK: true,
  SUBMIT_MEDIA: true
};

export const TASK_DUPLICATE_RESTRICTION: Record<TaskType, boolean> = {
  REFERRAL_LINK: true,
  BONUS_TASK: false,
  BONUS_TIMED: false,
  BONUS_LIMITED: false,
  BONUS_LOYALTY: false,
  BONUS_COMPLETE_PROFILE: false,
  VISIT_URL: false,
  ASK_QUESTION: false,
  SINGLE_CHOICE: false,
  MULTIPLE_CHOICE: false,
  TWITTER_CONNECT: false,
  TWITTER_FOLLOW: false,
  TWITTER_RETWEET: false,
  TWITTER_RETWEET_IMPORT: false,
  TWITTER_LIKE: false,
  TWITTER_LIKE_IMPORT: false,
  STEAM_WISHLIST: false,
  STEAM_FOLLOW: false,
  DISCORD_JOIN: false,
  TWITCH_FOLLOW: false,
  KICK_FOLLOW: false,
  SECRET_CODE: false,
  YOUTUBE_VISIT: false,
  INSTAGRAM_VISIT: false,
  INSTAGRAM_LIKE: false,
  INSTAGRAM_COMMENT: false,
  FACEBOOK_VISIT_PAGE: false,
  FACEBOOK_VIEW_POST: false,
  TIKTOK_FOLLOW: false,
  TIKTOK_LIKE: false,
  BLUESKY_CONNECT: false,
  BLUESKY_FOLLOW: false,
  BLUESKY_LIKE: false,
  BLUESKY_REPOST: false,
  BLUESKY_LIKE_IMPORT: false,
  BLUESKY_REPOST_IMPORT: false,
  SUBMIT_MEDIA: false
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
    console.error('Failed to parse task config:', parsed.error);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config',
      cause: parsed.error
    });
  }
};

export const toTaskSchemaSafe = (stored: Task): TaskSchema => {
  try {
    return toTaskSchema(stored);
  } catch {
    // TODO: add a unknown task type to represent failed parsing?
    return {
      type: 'BONUS_TASK',
      id: stored.id,
      title: 'Unknown Task',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    };
  }
};

export type TaskVerificationRequirement =
  | 'automatic'
  | 'manual'
  | 'self-reported';

export const TASK_VERIFICATION_REQUIREMENT: Record<
  TaskType,
  TaskVerificationRequirement
> = {
  VISIT_URL: 'manual',
  BONUS_TASK: 'manual',
  TWITTER_CONNECT: 'manual',
  TWITTER_FOLLOW: 'manual',
  TWITTER_RETWEET: 'manual',
  TWITTER_RETWEET_IMPORT: 'automatic',
  TWITTER_LIKE: 'manual',
  TWITTER_LIKE_IMPORT: 'automatic',
  YOUTUBE_VISIT: 'manual',
  KICK_FOLLOW: 'manual',
  INSTAGRAM_VISIT: 'manual',
  INSTAGRAM_LIKE: 'manual',
  INSTAGRAM_COMMENT: 'manual',
  FACEBOOK_VISIT_PAGE: 'manual',
  FACEBOOK_VIEW_POST: 'manual',
  TIKTOK_FOLLOW: 'manual',
  TIKTOK_LIKE: 'manual',
  BONUS_LIMITED: 'manual',
  BONUS_TIMED: 'manual',
  BONUS_LOYALTY: 'manual',
  BONUS_COMPLETE_PROFILE: 'manual',
  STEAM_WISHLIST: 'automatic',
  STEAM_FOLLOW: 'self-reported',
  DISCORD_JOIN: 'automatic',
  TWITCH_FOLLOW: 'automatic',
  SECRET_CODE: 'automatic',
  ASK_QUESTION: 'manual',
  SINGLE_CHOICE: 'manual',
  MULTIPLE_CHOICE: 'manual',
  BLUESKY_CONNECT: 'automatic',
  BLUESKY_FOLLOW: 'automatic',
  BLUESKY_LIKE: 'automatic',
  BLUESKY_REPOST: 'automatic',
  BLUESKY_LIKE_IMPORT: 'automatic',
  BLUESKY_REPOST_IMPORT: 'automatic',
  REFERRAL_LINK: 'manual',
  SUBMIT_MEDIA: 'manual'
};

// Deprecated: Use TASK_VERIFICATION_REQUIREMENT instead
export const TASK_HAS_AUTOMATIC_VALIDATION: Record<TaskType, boolean> = {
  VISIT_URL: false,
  BONUS_TASK: false,
  TWITTER_CONNECT: false,
  TWITTER_FOLLOW: false,
  TWITTER_RETWEET: false,
  TWITTER_RETWEET_IMPORT: true,
  TWITTER_LIKE: false,
  TWITTER_LIKE_IMPORT: true,
  YOUTUBE_VISIT: false,
  KICK_FOLLOW: false,
  INSTAGRAM_VISIT: false,
  INSTAGRAM_LIKE: false,
  INSTAGRAM_COMMENT: false,
  FACEBOOK_VISIT_PAGE: false,
  FACEBOOK_VIEW_POST: false,
  TIKTOK_FOLLOW: true,
  TIKTOK_LIKE: true,
  BONUS_LIMITED: false,
  BONUS_TIMED: false,
  BONUS_LOYALTY: false,
  BONUS_COMPLETE_PROFILE: false,
  STEAM_WISHLIST: true,
  STEAM_FOLLOW: false,
  DISCORD_JOIN: true,
  TWITCH_FOLLOW: true,
  SECRET_CODE: true,
  ASK_QUESTION: false,
  SINGLE_CHOICE: false,
  MULTIPLE_CHOICE: false,
  BLUESKY_CONNECT: true,
  BLUESKY_FOLLOW: true,
  BLUESKY_LIKE: true,
  BLUESKY_REPOST: true,
  BLUESKY_LIKE_IMPORT: true,
  BLUESKY_REPOST_IMPORT: true,
  REFERRAL_LINK: false,
  SUBMIT_MEDIA: false
};

export const twitterProofSchema = z.object({
  source: z.literal('twitter_import'),
  twitterUserId: z.string(),
  twitterUsername: z.string(),
  twitterVerified: z.boolean(),
  importedAt: z.string(),
  validatedBy: z.string()
});

export type TwitterProofSchema = z.infer<typeof twitterProofSchema>;

export const parseTwitterProofSchema = (
  data: unknown
): TwitterProofSchema | null => {
  const parsed = twitterProofSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

// to ensure compliance with the TwitterProofSchema
export const toTwitterProofSchema = (
  data: TwitterProofSchema
): TwitterProofSchema => data;
