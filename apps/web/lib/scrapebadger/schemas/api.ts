import { z } from 'zod';

export const scrapeBadgerUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  created_at: z.string().optional(),
  followers_count: z.number().optional(),
  following_count: z.number().optional(),
  tweet_count: z.number().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  profile_image_url: z.string().optional(),
  profile_banner_url: z.string().optional(),
  verified: z.boolean().optional()
});

export type ScrapeBadgerUser = z.infer<typeof scrapeBadgerUserSchema>;

export const scrapeBadgerRetweeterSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  profile_banner_url: z.string().nullable().optional(),
  followers_count: z.number().optional().default(0),
  following_count: z.number().optional().default(0),
  tweet_count: z.number().optional().default(0),
  listed_count: z.number().optional().default(0),
  favourites_count: z.number().optional().default(0),
  media_count: z.number().optional().default(0),
  verified: z.boolean().optional().default(false),
  verified_type: z.string().nullable().optional(),
  is_blue_verified: z.boolean().optional().default(false),
  created_at: z.string().optional(),
  created_at_datetime: z.string().optional(),
  default_profile: z.boolean().optional(),
  default_profile_image: z.boolean().optional(),
  protected: z.boolean().optional().default(false),
  possibly_sensitive: z.boolean().optional().default(false),
  followed_by: z.boolean().nullable().optional(),
  following: z.boolean().nullable().optional(),
  follow_request_sent: z.boolean().nullable().optional(),
  blocking: z.boolean().nullable().optional(),
  blocked_by: z.boolean().nullable().optional(),
  muting: z.boolean().nullable().optional(),
  notifications: z.boolean().nullable().optional(),
  can_dm: z.boolean().optional().default(false),
  has_custom_timelines: z.boolean().optional().default(false),
  has_extended_profile: z.boolean().nullable().optional(),
  is_translator: z.boolean().optional().default(false),
  is_translation_enabled: z.boolean().nullable().optional(),
  professional_type: z.string().nullable().optional(),
  advertiser_account_type: z.string().nullable().optional(),
  pinned_tweet_ids: z.array(z.string()).nullable().optional(),
  withheld_in_countries: z.array(z.string()).optional().default([])
});

export type ScrapeBadgerRetweeter = z.infer<typeof scrapeBadgerRetweeterSchema>;

export const scrapeBadgerTweetRetweetersSchema = z.object({
  data: z.array(scrapeBadgerRetweeterSchema),
  next_cursor: z.string().nullable().optional()
});

export type ScrapeBadgerTweetRetweeters = z.infer<
  typeof scrapeBadgerTweetRetweetersSchema
>;

export const scrapeBadgerTweetDetailSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  username: z.string(),
  favorite_count: z.number().optional().default(0),
  retweet_count: z.number().optional().default(0),
  reply_count: z.number().optional().default(0),
  view_count: z.number().optional().default(0),
  quote_count: z.number().optional().default(0),
  conversation_id: z.string().optional(),
  in_reply_to_user_id: z.string().optional(),
  is_quote_status: z.boolean().optional().default(false),
  lang: z.string().optional(),
  possibly_sensitive: z.boolean().optional(),
  media: z.array(z.any()).optional(),
  urls: z.array(z.any()).optional(),
  hashtags: z.array(z.any()).optional(),
  user_mentions: z.array(z.any()).optional()
});

export type ScrapeBadgerTweetDetail = z.infer<
  typeof scrapeBadgerTweetDetailSchema
>;
