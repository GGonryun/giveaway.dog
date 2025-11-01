import { ApplicationError } from '@/lib/errors';
import z from 'zod';

export const pickerWinnerSchema = z.object({
  userId: z.string(),
  position: z.number().int().positive(),
  selectedAt: z.date()
});

export type PickerWinnerSchema = z.infer<typeof pickerWinnerSchema>;

export const pickerDrawSchema = z.object({
  drawId: z.string(), // serves as the verification hash
  drawnAt: z.date(),
  drawNumber: z.number().int().positive(),
  eligibleEntries: z.number().int().nonnegative(),
  winner: pickerWinnerSchema,
  result: z.enum(['SUCCESS', 'DISQUALIFIED']),
  disqualificationReason: z.string().nullable(),
  previousDrawId: z.string().nullable()
});

export type PickerDrawSchema = z.infer<typeof pickerDrawSchema>;

export const pickerOutcomeSchema = z.object({
  totalDraws: z.number().int(),
  finalDraws: z.array(z.string())
});

export type PickerOutcomeSchema = z.infer<typeof pickerOutcomeSchema>;

export const pickerDrawsSchema = z.object({
  draws: z.array(pickerDrawSchema),
  outcome: pickerOutcomeSchema
});

export type PickerDrawsSchema = z.infer<typeof pickerDrawsSchema>;

export const parsePickerDrawsSchema = (data: unknown): PickerDrawsSchema => {
  const result = pickerDrawsSchema.safeParse(data);

  if (!result.success) {
    console.error('Picker draws schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid picker draws schema',
      cause: result.error
    });
  }

  return result.data;
};
