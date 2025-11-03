import { ApplicationError } from '@/lib/errors';
import {
  xStatusRefineError,
  xStatusRefineUrl
} from '@/lib/integrations/schemas/twitter';
import { DeepPartial } from '@/lib/types';
import { widetype } from '@/lib/widetype';
import { Prisma } from '@prisma/client';
import { Heart, LucideIcon, MessageSquare, Quote, Repeat2 } from 'lucide-react';
import { z } from 'zod';

export const pickerActionType = z.enum(['like', 'repost', 'quote', 'reply']);
export type PickerActionType = z.infer<typeof pickerActionType>;

export const PICKER_ACTION_TYPE_LABEL: Record<PickerActionType, string> = {
  like: 'Like',
  repost: 'Repost',
  quote: 'Quote',
  reply: 'Reply'
};

export const PICKER_ACTION_TYPE_ICON: Record<PickerActionType, LucideIcon> = {
  like: Heart,
  repost: Repeat2,
  quote: Quote,
  reply: MessageSquare
};

export const pickerActionsSchema = z.object({
  like: z.boolean().default(false),
  repost: z.boolean().default(false),
  quote: z.boolean().default(false),
  reply: z.boolean().default(false)
});
export type PickerActionsSchema = z.infer<typeof pickerActionsSchema>;

export const toPickerActionsArray = (
  actions: Partial<PickerActionsSchema>
): PickerActionType[] =>
  widetype
    .entries(actions)
    .filter(([_, value]) => value)
    .map(([key, _]) => key as PickerActionType);

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
  actions: pickerActionsSchema.refine(
    (data) => data.like || data.repost || data.quote || data.reply,
    {
      message: 'At least one action must be selected'
    }
  ),
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

export type PrismaPickerForm = Prisma.PickerFormGetPayload<{
  select: { data: true };
}>;

// input schema doesn't need validation as users are allowed to provide invalid or partial data.
export type PickerUnvalidatedFormSchema = DeepPartial<PickerFormSchema>;
export const pickerUnvalidatedFormSchema =
  z.custom<PickerUnvalidatedFormSchema>(
    (data): data is PickerUnvalidatedFormSchema =>
      typeof data === 'object' && data !== null
  );

export const parsePickerFormSchema = <T extends boolean>(
  config: PrismaPickerForm | null,
  { validate }: { validate?: T }
): T extends true ? PickerFormSchema : PickerUnvalidatedFormSchema => {
  const schema = validate ? pickerFormSchema : pickerUnvalidatedFormSchema;
  const result = schema.safeParse(config?.data);

  if (!result.success) {
    console.error('Picker form schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid picker form schema',
      cause: result.error
    });
  }

  return result.data as T extends true
    ? PickerFormSchema
    : PickerUnvalidatedFormSchema;
};

export const publishPickerInputSchema = z.object({
  pickerId: z.string(),
  form: pickerUnvalidatedFormSchema
});
export type PublishPickerInputSchema = z.infer<typeof publishPickerInputSchema>;
