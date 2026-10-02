import { Expand, FlatUnion } from '@giveaway/util-types/types';
import { SweepstakesFormFieldType } from '@prisma/client';
import z from 'zod';

export const baseSweepstakesFormFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required')
});

export const ageSweepstakesFormFieldSchema =
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.AGE),
    minimum: z.number().int().nullish(),
    maximum: z.number().int().nullish(),
    required: z.boolean().default(false)
  });

export type AgeSweepstakesFormFieldSchema = z.infer<
  typeof ageSweepstakesFormFieldSchema
>;

export const sweepstakesFormFieldSchema = z.discriminatedUnion('type', [
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.USERNAME),
    placeholder: z.string().nullish(),
    required: z.boolean().default(false)
  }),
  ageSweepstakesFormFieldSchema,
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.EMAIL),
    placeholder: z.string().nullish()
  }),
  baseSweepstakesFormFieldSchema.extend({
    type: z.literal(SweepstakesFormFieldType.TWITTER),
    placeholder: z.string().nullable(),
    required: z.boolean().default(false)
  })
]);

export type SweepstakesFormFieldSchema = z.infer<
  typeof sweepstakesFormFieldSchema
>;

export type FlatSweepstakesFormField = FlatUnion<
  Expand<SweepstakesFormFieldSchema>
>;

export const FIELD_TYPE_LABELS: Record<SweepstakesFormFieldType, string> = {
  [SweepstakesFormFieldType.USERNAME]: 'Username',
  [SweepstakesFormFieldType.AGE]: 'Age',
  [SweepstakesFormFieldType.EMAIL]: 'Email',
  [SweepstakesFormFieldType.TWITTER]: 'Twitter Profile'
};
