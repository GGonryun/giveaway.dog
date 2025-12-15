import { userSchema } from '@/schemas/user';
import z from 'zod';

import { taskCompletionSchema } from '../task/completions';
import { SweepstakesFormFieldType } from '@prisma/client';

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
  user: userSchema,
  completions: taskCompletionSchema.array(),
  formValues: z.record(z.string(), z.any())
});

export type SweepstakesParticipantSchema = z.infer<
  typeof sweepstakesParticipantSchema
>;

export const resolvedFormFieldSchema = z.object({
  fieldId: z.string(),
  label: z.string(),
  value: z.string().nullable(),
  type: z.nativeEnum(SweepstakesFormFieldType)
});

export type ResolvedFormFieldSchema = z.infer<typeof resolvedFormFieldSchema>;
