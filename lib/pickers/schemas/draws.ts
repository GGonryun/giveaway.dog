import { ApplicationError } from '@/lib/errors';
import { PickerDrawResult, Prisma } from '@prisma/client';
import z from 'zod';

export const pickerWinnerSchema = z.object({
  userId: z.string(),
  position: z.number().int().positive()
});

export type PickerWinnerSchema = z.infer<typeof pickerWinnerSchema>;

export const pickerDrawSchema = z.object({
  drawId: z.string(), // serves as the verification hash
  drawnAt: z.date(),
  drawNumber: z.number().int().positive(),
  eligibleEntries: z.number().int().nonnegative(),
  winner: pickerWinnerSchema,
  result: z.nativeEnum(PickerDrawResult),
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

export const parsePickerDrawsSchema = (
  data: Prisma.PickerDrawGetPayload<{}>[]
): PickerDrawsSchema => {
  const draws = data.map((draw) => ({
    drawId: draw.id,
    drawnAt: draw.createdAt,
    drawNumber: draw.order,
    eligibleEntries: draw.eligibleEntries,
    winner: {
      userId: draw.user,
      position: draw.position
    },
    result: draw.result,
    disqualificationReason: draw.disqualificationReason,
    previousDrawId: draw.previousDrawId
  }));

  return {
    draws,
    outcome: {
      totalDraws: draws.length,
      finalDraws: draws
        .filter((draw) => draw.result === PickerDrawResult.WINNER)
        .map((draw) => draw.drawId)
    }
  };
};
