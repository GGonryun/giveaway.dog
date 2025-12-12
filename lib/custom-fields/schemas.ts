import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { Expand, FlatUnion } from '@/lib/types';
import { SweepstakesFormFieldType } from '@prisma/client';
import { LucideIcon, UserIcon, BalloonIcon, MailIcon } from 'lucide-react';
import z from 'zod';

export const baseSweepstakesFormFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required')
});

export const ageSweepstakesFormFieldSchema =
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.AGE),
    minimum: z.number().int().optional(),
    maximum: z.number().int().optional(),
    required: z.boolean().default(false)
  });

export type AgeSweepstakesFormFieldSchema = z.infer<
  typeof ageSweepstakesFormFieldSchema
>;

export const sweepstakesFormFieldSchema = z.discriminatedUnion('type', [
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.USERNAME),
    placeholder: z.string().optional(),
    required: z.boolean().default(false)
  }),
  ageSweepstakesFormFieldSchema,
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.EMAIL),
    placeholder: z.string().optional()
  }),
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.TWITTER),
    placeholder: z.string().optional(),
    required: z.boolean().default(false)
  })
]);

export type SweepstakesFormFieldSchema = z.infer<
  typeof sweepstakesFormFieldSchema
>;

export type FlatSweepstakesFormField = FlatUnion<
  Expand<SweepstakesFormFieldSchema>
>;

export const FIELD_TYPE_ICON: Record<SweepstakesFormFieldType, LucideIcon> = {
  [SweepstakesFormFieldType.USERNAME]: UserIcon,
  [SweepstakesFormFieldType.AGE]: BalloonIcon,
  [SweepstakesFormFieldType.EMAIL]: MailIcon,
  [SweepstakesFormFieldType.TWITTER]: SocialXIcon
};

export const FIELD_TYPE_LABELS: Record<SweepstakesFormFieldType, string> = {
  [SweepstakesFormFieldType.USERNAME]: 'Username',
  [SweepstakesFormFieldType.AGE]: 'Age',
  [SweepstakesFormFieldType.EMAIL]: 'Email',
  [SweepstakesFormFieldType.TWITTER]: 'Twitter Profile'
};
