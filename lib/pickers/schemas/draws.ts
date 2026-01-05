import { PickerDrawResult, Prisma } from '@prisma/client';
import z from 'zod';

export const pickerWinnerSchema = z.object({
  userId: z.string(),
  position: z.number().int().positive(),
  username: z.string().optional(),
  name: z.string().optional(),
  profile_image_url: z.string().nullable().optional()
});

export type PickerWinnerSchema = z.infer<typeof pickerWinnerSchema>;

export const pickerDrawSchema = z.object({
  drawId: z.string(), // serves as the verification hash
  drawnAt: z.coerce.date(),
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

interface TwitterUserData {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export const parsePickerDrawsSchema = (
  data: Prisma.PickerDrawGetPayload<{}>[],
  users?: TwitterUserData[]
): PickerDrawsSchema => {
  const userMap = new Map(users?.map((u) => [u.id, u]) || []);

  const draws = data
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((draw, i) => {
      const userData = userMap.get(draw.user);
      return {
        drawId: draw.id,
        drawnAt: draw.createdAt,
        drawNumber: i + 1,
        eligibleEntries: draw.eligibleEntries,
        winner: {
          userId: draw.user,
          position: draw.position,
          username: userData?.username,
          name: userData?.name,
          profile_image_url: userData?.profile_image_url || null
        },
        result: draw.result,
        disqualificationReason: draw.disqualificationReason,
        previousDrawId: draw.previousDrawId
      };
    });

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
