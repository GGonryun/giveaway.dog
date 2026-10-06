import { userSchema } from '@giveaway/user-model/user';
import z from 'zod';

import { taskCompletionSchema } from '@giveaway/task-model/completions';
import { SweepstakesFormFieldType, UserSource } from '@giveaway/db-model';
import { sweepstakesAllocationSchema } from '@giveaway/sweepstakes-model/schemas';

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

export const teamParticipantsSortBySchema = z.enum([
  'lastEntry',
  'qualityScore',
  'name'
]);

export const teamParticipantsSortDirectionSchema = z.enum(['asc', 'desc']);

export const teamParticipantsQuerySchema = z.object({
  slug: z.string(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  sources: z.array(z.nativeEnum(UserSource)).optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  maxQualityScore: z.number().min(0).max(100).optional(),
  sortBy: teamParticipantsSortBySchema.optional().default('lastEntry'),
  sortDirection: teamParticipantsSortDirectionSchema.optional().default('desc')
});
