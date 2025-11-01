import { ApplicationError } from '@/lib/errors';
import { xStatusRefineError, xStatusRefineUrl } from '@/lib/twitter/schemas';
import { DeepPartial } from '@/lib/types';
import { z } from 'zod';

export const pickerFormSchema = z.object({
  setup: z.object({
    postUrl: z
      .string()
      .min(1, 'Post URL is required')
      .url('Please enter a valid URL')
      .refine(xStatusRefineUrl, {
        message: xStatusRefineError
      }),
    name: z.string().min(1, 'Picker name is required')
  }),
  winners: z.object({
    quota: z.number().min(1, 'Must have at least 1 winner').default(1)
  }),
  actions: z
    .object({
      like: z.boolean().default(false),
      retweet: z.boolean().default(false),
      quote: z.boolean().default(false),
      reply: z.boolean().default(false)
    })
    .refine((data) => data.like || data.retweet || data.quote || data.reply, {
      message: 'At least one action must be selected'
    }),
  filters: z.object({
    minimumPostCount: z.number().min(0).nullable().default(null),
    minimumAccountAgeDays: z.number().min(0).nullable().default(null),
    minimumFollowers: z.number().min(0).nullable().default(null),
    minimumFollowing: z.number().min(0).nullable().default(null)
  }),
  requirements: z.object({
    hasProfileImage: z.boolean().default(false),
    hasBanner: z.boolean().default(false),
    hasLocation: z.boolean().default(false),
    hasDescription: z.boolean().default(false)
  })
});

export type PickerFormSchema = z.infer<typeof pickerFormSchema>;

export const parsePickerFormSchema = (data: unknown): PickerFormSchema => {
  const result = pickerFormSchema.safeParse(data);

  if (!result.success) {
    console.error('Picker form schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid picker form schema',
      cause: result.error
    });
  }

  return result.data;
};

// input schema doesn't need validation as users are allowed to provide invalid or partial data.
export type PickerUnvalidatedFormSchema = DeepPartial<PickerFormSchema>;
export const pickerUnvalidatedFormSchema =
  z.custom<PickerUnvalidatedFormSchema>(
    (data): data is PickerUnvalidatedFormSchema =>
      typeof data === 'object' && data !== null
  );

export const parseUnvalidatedFormSchema = (
  data: unknown = {}
): PickerUnvalidatedFormSchema => {
  const result = pickerUnvalidatedFormSchema.safeParse(data);

  if (!result.success) {
    console.error('Picker form schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid picker form schema',
      cause: result.error
    });
  }

  return result.data;
};
