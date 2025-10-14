import z from 'zod';

export const userScoreMetricsSchema = z.object({
  deviceStability: z.number(),
  ipConsistency: z.number(),
  geoConsistency: z.number(),
  providersConnected: z.number(),
  emailVerified: z.number(),
  taskActivity: z.number(),
  taskDiversity: z.number(),
  accountAge: z.number(),
  overlappingIpAddresses: z.number(),
  overlappingFingerprints: z.number()
});

export type UserScoreMetricsSchema = z.infer<typeof userScoreMetricsSchema>;
