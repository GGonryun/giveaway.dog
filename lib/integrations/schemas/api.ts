import z from 'zod';

export const twitterUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  created_at: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  profile_image_url: z.string().optional(),
  profile_banner_url: z.string().optional(),
  protected: z.boolean().optional(),
  verified: z.boolean().optional(),
  verified_type: z.string().optional(),
  public_metrics: z
    .object({
      followers_count: z.number(),
      following_count: z.number(),
      tweet_count: z.number(),
      listed_count: z.number()
    })
    .optional()
});

export type TwitterUserSchema = z.infer<typeof twitterUserSchema>;

export const actionsTwitterUserSchema = twitterUserSchema.extend({
  actions: z.array(z.enum(['like', 'retweet', 'quote', 'reply'])).default([])
});

export type ActionsTwitterUser = z.infer<typeof actionsTwitterUserSchema>;

export const eligibleTwitterUserSchema = actionsTwitterUserSchema.extend({
  ineligible: z.string().optional()
});

export type EligibleTwitterUser = z.infer<typeof eligibleTwitterUserSchema>;

export const tweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author_id: z.string().optional(),
  created_at: z.string().optional(),
  conversation_id: z.string().optional(),
  in_reply_to_user_id: z.string().optional(),
  referenced_tweets: z
    .array(
      z.object({
        type: z.enum(['retweeted', 'quoted', 'replied_to']),
        id: z.string()
      })
    )
    .optional(),
  public_metrics: z
    .object({
      retweet_count: z.number(),
      reply_count: z.number(),
      like_count: z.number(),
      quote_count: z.number(),
      bookmark_count: z.number().optional(),
      impression_count: z.number().optional()
    })
    .optional()
});

export type Tweet = z.infer<typeof tweetSchema>;

export const quoteTweetsResponseSchema = z.object({
  data: z.array(tweetSchema).optional(),
  includes: z
    .object({
      users: z.array(twitterUserSchema).optional()
    })
    .optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional()
    })
    .optional()
});

export type QuoteTweetsResponse = z.infer<typeof quoteTweetsResponseSchema>;

export const quoteTweetsRequest = z.object({
  tweetId: z.string(),
  paginationToken: z.string().optional()
});

export type QuoteTweetsRequest = z.infer<typeof quoteTweetsRequest>;

export const likingUsersResponseSchema = z.object({
  data: z.array(twitterUserSchema).optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional()
    })
    .optional()
});
export type LikingUsersResponse = z.infer<typeof likingUsersResponseSchema>;

export const likingUsersRequest = z.object({
  tweetId: z.string(),
  paginationToken: z.string().optional()
});

export type LikingUsersRequest = z.infer<typeof likingUsersRequest>;

export const retweetedByResponseSchema = z.object({
  data: z.array(twitterUserSchema).optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional()
    })
    .optional()
});

export type RetweetedByResponse = z.infer<typeof retweetedByResponseSchema>;

export const retweetedByRequest = z.object({
  tweetId: z.string(),
  paginationToken: z.string().optional()
});

export type RetweetedByRequest = z.infer<typeof retweetedByRequest>;

export const repliedByResponseSchema = z.object({
  data: z.array(tweetSchema).optional(),
  includes: z
    .object({
      users: z.array(twitterUserSchema).optional()
    })
    .optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional()
    })
    .optional()
});

export type RepliedByResponse = z.infer<typeof repliedByResponseSchema>;

export const repliedByRequest = z.object({
  tweetId: z.string(),
  paginationToken: z.string().optional()
});

export type RepliedByRequest = z.infer<typeof repliedByRequest>;
