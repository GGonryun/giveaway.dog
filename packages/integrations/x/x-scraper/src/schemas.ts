import { z } from 'zod';

export const scrapeBadgerMediaSchema = z.object({
  type: z.string().nullish(),
  url: z.string().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  alt_text: z.string().nullish()
});

export const scrapeBadgerTweetSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  created_at: z.string().nullish(),
  user_id: z.string().nullish(),
  username: z.string().nullish(),
  user_name: z.string().nullish(),
  favorite_count: z.number().default(0),
  retweet_count: z.number().default(0),
  reply_count: z.number().default(0),
  quote_count: z.number().default(0),
  view_count: z.number().nullish(),
  media: z.array(scrapeBadgerMediaSchema).default([])
});

export type ScrapeBadgerTweet = z.infer<typeof scrapeBadgerTweetSchema>;

export const scrapeBadgerUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().default(''),
  description: z.string().nullish(),
  location: z.string().nullish(),
  url: z.string().nullish(),
  profile_image_url: z.string().nullish(),
  profile_banner_url: z.string().nullish(),
  followers_count: z.number().nullish(),
  following_count: z.number().nullish(),
  tweet_count: z.number().nullish(),
  verified: z.boolean().default(false),
  verified_type: z.string().nullish(),
  is_blue_verified: z.boolean().nullish(),
  created_at: z.string().nullish(),
  can_dm: z.boolean().nullish()
});

export type ScrapeBadgerUser = z.infer<typeof scrapeBadgerUserSchema>;

export const scrapeBadgerUserPageSchema = z.object({
  data: z.array(scrapeBadgerUserSchema),
  nextCursor: z
    .string()
    .nullish()
    .transform((cursor) => cursor ?? undefined),
  hasMore: z.boolean()
});

export type ScrapeBadgerUserPage = z.infer<typeof scrapeBadgerUserPageSchema>;
