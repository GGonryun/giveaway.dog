import {
  xStatusRefineError,
  xStatusRefineUrl
} from '@giveaway/x-model/twitter';
import { MAX_PICKER_SCHEDULE_DAYS } from '@giveaway/app-config/settings';
import { DeepPartial } from '@giveaway/util-types/types';
import { z } from 'zod';

const twitterUserFiltersSchema = z.object({
  minimumPostCount: z.number().nullable().default(null),
  minimumAccountAgeDays: z.number().nullable().default(null),
  minimumFollowers: z.number().nullable().default(null),
  minimumFollowing: z.number().nullable().default(null),
  lastPostWithin: z
    .enum(['PAST_DAY', 'PAST_WEEK', 'PAST_MONTH'])
    .nullable()
    .default(null),
  hasProfileImage: z.boolean().default(false),
  hasBanner: z.boolean().default(false),
  hasLocation: z.boolean().default(false),
  hasDescription: z.boolean().default(false)
});

// Define actions schema inline (v2 only supports repost + reply)
const pickerActionsSchema = z.object({
  repost: z.boolean().default(true),
  reply: z.boolean().default(false)
});

const timingSchema = ({
  validate,
  maxDurationDays
}: {
  validate: boolean;
  maxDurationDays: number;
}) =>
  z
    .object({
      runAt: z.string(),
      timeZone: z.string()
    })
    .superRefine((data, ctx) => {
      if (!validate) return;
      const startDate = new Date();
      const runAtDate = new Date(data.runAt);
      if (runAtDate <= startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Run date must be in the future',
          path: ['runAt']
        });
      }
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + maxDurationDays);
      if (runAtDate > maxEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duration cannot exceed ${maxDurationDays} days`,
          path: ['runAt']
        });
      }
    });

// New form schema mapping directly to TwitterPicker fields
export const twitterV2PickerFormSchema = ({
  validateTiming
}: {
  validateTiming: boolean;
}) =>
  z.object({
    setup: z.object({
      postUrls: z
        .array(
          z.object({
            url: z
              .string()
              .min(1, 'Post URL is required')
              .url('Please enter a valid URL')
              .refine(xStatusRefineUrl, {
                message: xStatusRefineError
              })
          })
        )
        .min(1, 'At least one post URL is required')
        .superRefine((urls, ctx) => {
          const seen = new Map<string, number>();
          urls.forEach(({ url }, index) => {
            const tweetId = extractTweetIdFromUrl(url);
            if (!tweetId) return;
            if (seen.has(tweetId)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'This post is already added',
                path: [index, 'url']
              });
            } else {
              seen.set(tweetId, index);
            }
          });
        })
    }),
    actions: pickerActionsSchema.refine((data) => data.repost, {
      message: 'Repost action must be enabled for V2 pickers'
    }),
    timing: timingSchema({
      validate: validateTiming,
      maxDurationDays: MAX_PICKER_SCHEDULE_DAYS
    })
      .nullable()
      .optional(),
    winners: z.object({
      quota: z.number().min(1, 'Must have at least 1 winner').default(1)
    }),
    filters: twitterUserFiltersSchema
  });

export type TwitterV2PickerFormSchema = z.infer<
  ReturnType<typeof twitterV2PickerFormSchema>
>;

export type TwitterUserFiltersSchema = z.infer<typeof twitterUserFiltersSchema>;

// Unvalidated schema for partial/draft data
export type TwitterV2PickerUnvalidatedFormSchema =
  DeepPartial<TwitterV2PickerFormSchema>;
export const twitterV2PickerUnvalidatedFormSchema =
  z.custom<TwitterV2PickerUnvalidatedFormSchema>(
    (data): data is TwitterV2PickerUnvalidatedFormSchema =>
      typeof data === 'object' && data !== null
  );

// Input schema for publishing
export const publishTwitterV2PickerInputSchema = z.object({
  pickerId: z.string(),
  form: twitterV2PickerUnvalidatedFormSchema
});
export type PublishTwitterV2PickerInputSchema = z.infer<
  typeof publishTwitterV2PickerInputSchema
>;

// Helper to extract tweetId from URL
export const extractTweetIdFromUrl = (url: string): string | null => {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
};
