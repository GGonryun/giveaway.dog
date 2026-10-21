import 'server-only';

import { z } from 'zod';

export const scrapeBadgerUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  url: z.string().nullish(),
  profile_image_url: z.string().nullish(),
  profile_banner_url: z.string().nullish(),
  followers_count: z.number(),
  following_count: z.number(),
  tweet_count: z.number(),
  verified: z.boolean(),
  verified_type: z.string().nullish(),
  created_at: z.string().nullish(),
  can_dm: z.boolean().nullish()
});

export const scrapeBadgerTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string().nullish(),
  user_id: z.string().nullish(),
  username: z.string().nullish(),
  user_name: z.string().nullish(),
  favorite_count: z.number(),
  retweet_count: z.number(),
  reply_count: z.number(),
  quote_count: z.number(),
  view_count: z.union([z.number(), z.string().regex(/^\d+$/)]).nullish()
});

export const scrapeBadgerRetweetersSchema = z.object({
  data: z.array(scrapeBadgerUserSchema),
  next_cursor: z.string().nullish()
});
