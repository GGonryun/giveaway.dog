import z from 'zod';

export const winnerLeaderboardSchema = z.object({
  userId: z.string(),
  userName: z.string().nullable(),
  userImage: z.string().nullable(),
  winCount: z.number(),
  wins: z.array(
    z.object({
      sweepstakesId: z.string(),
      sweepstakesName: z.string(),
      sweepstakesSlug: z.string(),
      teamSlug: z.string(),
      prizeName: z.string().nullable(),
      wonAt: z.date()
    })
  )
});

export type WinnerLeaderboardSchema = z.infer<typeof winnerLeaderboardSchema>;
