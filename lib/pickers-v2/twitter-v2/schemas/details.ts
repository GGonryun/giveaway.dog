import { PickerStatus } from '@prisma/client';
import z from 'zod';

export const twitterV2PickerUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  location: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  bannerImageUrl: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
  canDm: z.boolean().nullable(),
  followersCount: z.number().nullable(),
  followingCount: z.number().nullable(),
  tweetCount: z.number().nullable(),
  verified: z.boolean().nullable(),
  ineligible: z.string().optional()
});

export type TwitterV2PickerUserSchema = z.infer<
  typeof twitterV2PickerUserSchema
>;

export const twitterV2PickerDrawSchema = z.object({
  id: z.string(),
  userId: z.string(),
  disqualified: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type TwitterV2PickerDrawSchema = z.infer<
  typeof twitterV2PickerDrawSchema
>;

export const twitterV2PickerSchema = z.object({
  id: z.string(),
  runId: z.string().nullable(),
  teamId: z.string(),
  tweetUrls: z.array(z.string()),
  status: z.nativeEnum(PickerStatus),
  winners: z.number(),
  minPostCount: z.number().nullable(),
  minAccountAgeDays: z.number().nullable(),
  minFollowersCount: z.number().nullable(),
  minFollowingCount: z.number().nullable(),
  requireProfileImage: z.boolean().nullable(),
  requireBannerImage: z.boolean().nullable(),
  requireLocation: z.boolean().nullable(),
  requireBio: z.boolean().nullable(),
  runAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  users: z.array(twitterV2PickerUserSchema),
  draws: z.array(twitterV2PickerDrawSchema)
});

export type TwitterV2PickerSchema = z.infer<typeof twitterV2PickerSchema>;
