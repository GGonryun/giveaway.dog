import {
  xStatusRefineError,
  xStatusRefineUrl
} from '@/lib/integrations/schemas/twitter';
import { MAX_PICKER_SCHEDULE_DAYS } from '@/lib/settings';
import { DeepPartial } from '@/lib/types';
import { z } from 'zod';

// Define filters schema inline (duplicated from v1 for independence)
const twitterUserFiltersSchema = z.object({
  minimumPostCount: z.number().nullable().default(null),
  minimumAccountAgeDays: z.number().nullable().default(null),
  minimumFollowers: z.number().nullable().default(null),
  minimumFollowing: z.number().nullable().default(null)
});

// Define requirements schema inline (duplicated from v1 for independence)
const twitterUserRequirementsSchema = z.object({
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
}) => {
  const runAt = validate
    ? z.string().refine((date) => new Date(date) > new Date(), {
        message: 'Run date must be in the future'
      })
    : z.string();
  const obj = z.object({
    runAt,
    timeZone: z.string()
  });
  if (!validate) return obj;
  return obj.superRefine((data, ctx) => {
    const startDate = new Date();
    const runAtDate = new Date(data.runAt);
    if (startDate && runAtDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Run date must be in the future',
        path: ['runAt']
      });
    }
    if (startDate) {
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + maxDurationDays);
      if (new Date(runAtDate) > maxEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duration cannot exceed ${maxDurationDays} days`,
          path: ['runAt']
        });
      }
    }
  });
};

// New form schema mapping directly to TwitterPicker fields
export const twitterV2PickerFormSchema = ({
  validateTiming
}: {
  validateTiming: boolean;
}) =>
  z.object({
    setup: z.object({
      postUrl: z
        .string()
        .min(1, 'Post URL is required')
        .url('Please enter a valid URL')
        .refine(xStatusRefineUrl, {
          message: xStatusRefineError
        })
      // No name field - TwitterPicker doesn't need it
      // No integrationId - v2 uses ScrapeBadger API
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
    // These map directly to TwitterPicker.minPostCount, minAccountAgeDays, etc.
    filters: twitterUserFiltersSchema,
    // These map directly to TwitterPicker.requireProfileImage, requireBannerImage, etc.
    requirements: twitterUserRequirementsSchema
  });

export type TwitterV2PickerFormSchema = z.infer<
  ReturnType<typeof twitterV2PickerFormSchema>
>;

export type TwitterUserFiltersSchema = z.infer<typeof twitterUserFiltersSchema>;
export type TwitterUserRequirementsSchema = z.infer<
  typeof twitterUserRequirementsSchema
>;

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
