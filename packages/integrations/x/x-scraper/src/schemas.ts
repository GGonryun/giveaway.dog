import { z } from 'zod';
import { withFallback } from '@giveaway/integration-server/provider-response';

const toNumber = (value: unknown) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

const optionalCount = withFallback(
  z.preprocess(toNumber, z.number().nullish()),
  null
);

const countOrZero = optionalCount.transform((count) => count ?? 0);

const optionalText = withFallback(z.string().nullish(), null);

const textOrEmpty = optionalText.transform((text) => text ?? '');

const optionalFlag = withFallback(z.boolean().nullish(), null);

const flagOrFalse = optionalFlag.transform((flag) => flag ?? false);

export const scrapeBadgerMediaSchema = z.object({
  type: optionalText,
  url: optionalText,
  width: optionalCount,
  height: optionalCount,
  alt_text: optionalText
});

export const scrapeBadgerTweetSchema = z.object({
  id: z.string(),
  text: textOrEmpty,
  created_at: optionalText,
  user_id: optionalText,
  username: optionalText,
  user_name: optionalText,
  favorite_count: countOrZero,
  retweet_count: countOrZero,
  reply_count: countOrZero,
  quote_count: countOrZero,
  view_count: optionalCount,
  media: withFallback(
    z.array(scrapeBadgerMediaSchema).nullish(),
    null
  ).transform((media) => media ?? [])
});

export type ScrapeBadgerTweet = z.infer<typeof scrapeBadgerTweetSchema>;

export const scrapeBadgerUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: textOrEmpty,
  description: optionalText,
  location: optionalText,
  url: optionalText,
  profile_image_url: optionalText,
  profile_banner_url: optionalText,
  followers_count: optionalCount,
  following_count: optionalCount,
  tweet_count: optionalCount,
  verified: flagOrFalse,
  verified_type: optionalText,
  is_blue_verified: optionalFlag,
  created_at: optionalText,
  can_dm: optionalFlag
});

export type ScrapeBadgerUser = z.infer<typeof scrapeBadgerUserSchema>;

export const scrapeBadgerUserPageSchema = z.object({
  data: z.array(z.unknown()),
  nextCursor: z
    .string()
    .nullish()
    .transform((cursor) => cursor ?? undefined),
  hasMore: z.boolean()
});

export type ScrapeBadgerUserPage = {
  data: ScrapeBadgerUser[];
  nextCursor?: string;
  hasMore: boolean;
};
