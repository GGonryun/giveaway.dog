import { ApplicationError } from '@/lib/errors';
import z from 'zod';

export const twitterActionsSchema = z.enum([
  'LIKE',
  'RETWEET',
  'QUOTE',
  'REPLY'
]);

export type TwitterActionsSchema = z.infer<typeof twitterActionsSchema>;

export const pickerTwitterUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url(),
  hasProfileImage: z.boolean(),
  hasBanner: z.boolean(),
  hasLocation: z.boolean(),
  hasDescription: z.boolean(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  tweetCount: z.number().int().nonnegative(),
  createdAt: z.date()
});

export const pickerTwitterActionSchema = z.object({
  userId: z.string(),
  action: twitterActionsSchema
});

export const pickerDataSchema = z.object({
  type: z.enum(['TWITTER']),
  tweetId: z.string(),
  users: z.array(pickerTwitterUserSchema),
  actions: z.array(pickerTwitterActionSchema),
  winners: z.array(z.string())
});

export type PickerDataSchema = z.infer<typeof pickerDataSchema>;

export const parsePickerDataSchema = (data: unknown): PickerDataSchema => {
  const result = pickerDataSchema.safeParse(data);

  if (!result.success) {
    console.error('Picker data schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      cause: result.error,
      message: 'Invalid picker data schema'
    });
  }

  return result.data;
};
