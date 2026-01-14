import { userSchema } from '@/schemas/user';
import z from 'zod';

import { taskCompletionSchema } from '../task/completions';
import { SweepstakesFormFieldType } from '@prisma/client';
import { sweepstakesAllocationSchema } from '@/schemas/giveaway/schemas';

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
  user: userSchema,
  completions: taskCompletionSchema.array(),
  allocation: sweepstakesAllocationSchema.nullish(),
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

export const publicSweepstakesParticipationSchema = z.record(
  z.object({
    sweepstakesId: z.string(),
    completed: z.number(),
    maximum: z.number()
  })
);

export type PublicSweepstakesParticipationSchema = z.infer<
  typeof publicSweepstakesParticipationSchema
>;
